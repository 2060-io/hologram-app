import { HeaderBackButton } from '@react-navigation/elements'
import { CommonActions } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native'
import { getCountry } from 'react-native-localize'
import RNPickerSelect from 'react-native-picker-select'

import countries from './countries.json'
import getStyles from './styles'
import unicIDService from './unicIDInfo.json'

import { CredentialIssuer } from '@2060/components'
import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { HeaderTitle, Icon, SvgIcon, Text } from '@2060/components/common'
import { useChats, useMobileAgent } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { ServiceInfo } from '@2060/services/api'
import { getGlobalStyles } from '@2060/styles'
import { getFlagEmoji, logError } from '@2060/utils'
import { widthPercentageToDP } from '@2060/utils/responsiveUtils'
import { toast } from '@2060/utils/toast'

interface Props extends StackScreenProps<NavigationStackParams, 'IdentityCredentialIssuers'> {}

const IdentityCredentialIssuers = ({ navigation }: Props) => {
  const routes = navigation.getState()?.routes
  const comesFromOnboarding = routes.length === 1
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const globalStyles = getGlobalStyles(theme)
  const [selectedCountry, setSelectedCountry] = useState(getCountry())
  const [userMadeSomeAction, setUserMadeSomeAction] = useState(false)
  const { agent } = useMobileAgent()
  const { findOrCreateThread } = useChats()

  const goToChats = () => {
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Home' }] }))
  }

  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: !comesFromOnboarding,
      headerStyle: { ...globalStyles.headerStyle },
      headerLeft: props => (comesFromOnboarding ? null : <HeaderBackButton {...props} />),
      headerTitleContainerStyle: styles.headerTitleContainerStyle,
      headerTitle: () => <HeaderTitle title={t('navigation.IdentityCredentialIssuers')} theme={theme} />,
      headerTitleAlign: 'center',
      headerRight: () =>
        comesFromOnboarding ? (
          <TouchableOpacity style={styles.headerRight} onPress={goToChats}>
            <Text typography="EuclidCircularA-Medium" style={styles.headerText}>
              {userMadeSomeAction ? t('personalChat.close') : t('general.skip')}
            </Text>
          </TouchableOpacity>
        ) : null,
    })
  }, [theme, userMadeSomeAction])

  const connect = async (service: ServiceInfo) => {
    if (!agent) return null
    try {
      setUserMadeSomeAction(true)
      let { connectionRecord } = await agent.oob.receiveImplicitInvitation({
        did: service.did,
        label: service.name,
        imageUrl: service.logoUrl,
        autoAcceptConnection: true,
      })
      if (!connectionRecord) throw new Error('Error connecting')

      connectionRecord = await agent.connections.returnWhenIsConnected(connectionRecord.id, {
        timeoutMs: 5000,
      })
      findOrCreateThread({ connection: connectionRecord })
      return connectionRecord
    } catch (error) {
      toast({
        type: 'error',
        message: t('connection.errorConnecting', { name: service.name }),
        duration: 5000,
      })
      logError(`error connecting to service: ${error}`)
      return null
    }
  }

  const tryToOpenURL = useCallback(async (url: string) => {
    const supported = await Linking.canOpenURL(url)
    if (supported) {
      await Linking.openURL(url)
    } else {
      toast({ type: 'error', message: `${t('general.canNotOpenURL')} ${url}` })
    }
  }, [])

  const goToConnectionDetails = useCallback((connectionId: string) => {
    navigation.navigate('ConnectionDetails', { connectionId })
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.subContainer}>
        <SvgIcon name="credential" width={'100%'} height={widthPercentageToDP('35')} style={styles.icon} />
        <Text typography="EuclidCircularA-Regular" style={styles.text}>
          {t('credential.issuerInstructions')}
        </Text>
        <Text typography="EuclidCircularA-SemiBold" style={styles.citizenship}>
          {t('credential.citizenship')}
        </Text>
        <RNPickerSelect
          placeholder={{
            label: t('credential.citizenship'),
            value: null,
            color: theme.colors.tertiaryText,
          }}
          value={selectedCountry}
          onValueChange={setSelectedCountry}
          items={countries.map(country => ({
            label: `${country.name} ${getFlagEmoji(country.code)}`,
            value: country.code,
            color: theme.colors.tertiaryText,
          }))}
          darkTheme={theme.isDarkMode}
          useNativeAndroidPickerStyle={false}
          style={{
            inputIOS: styles.inputPickerContainer,
            inputAndroid: styles.inputPickerContainer,
            iconContainer: styles.pickerIconContainer,
          }}
          Icon={() => {
            return (
              <Icon
                as="MaterialIcons"
                name="keyboard-arrow-down"
                size={30}
                color={theme.colors.tertiaryText}
              />
            )
          }}
        />
        <Text typography="EuclidCircularA-SemiBold" style={[styles.text, { marginBottom: 10 }]}>
          {t('credential.availableIssuers')}
        </Text>
        <CredentialIssuer
          connect={connect}
          service={unicIDService as ServiceInfo}
          tryToOpenURL={tryToOpenURL}
          goToConnectionDetails={goToConnectionDetails}
          agent={agent}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

export default IdentityCredentialIssuers
