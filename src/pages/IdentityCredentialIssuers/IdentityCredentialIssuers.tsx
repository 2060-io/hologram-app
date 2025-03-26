import { Picker } from '@react-native-picker/picker'
import { StackActions } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, SafeAreaView, ScrollView } from 'react-native'
import { getCountry } from 'react-native-localize'

import countries from './countries.json'
import getStyles from './styles'
import unicIDService from './unicIDInfo.json'

import { CredentialIssuer } from '@2060/components'
import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { SvgIcon, Text } from '@2060/components/common'
import { useChats, useMobileAgent } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { ServiceInfo } from '@2060/services/api'
import { getFlagEmoji, logError } from '@2060/utils'
import { widthPercentageToDP } from '@2060/utils/responsiveUtils'
import { toast } from '@2060/utils/toast'

interface Props extends StackScreenProps<NavigationStackParams, 'IdentityCredentialIssuers'> {}

const IdentityCredentialIssuers = ({ navigation }: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const [selectedCountry, setSelectedCountry] = useState(getCountry())
  const { agent } = useMobileAgent()
  const { findOrCreateThread } = useChats()

  const connect = async (service: ServiceInfo) => {
    if (!agent) return null
    try {
      let { connectionRecord } = await agent.oob.receiveImplicitInvitation({
        did: service.did,
        alias: service.name,
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

  const goToChat = (chatThreadId: string) => {
    navigation.dispatch(
      StackActions.push('PersonalChatStack', { screen: 'PersonalChat', params: { chatThreadId } }),
    )
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
        <SvgIcon name="MRZ" width={'100%'} height={widthPercentageToDP('43')} style={styles.icon} />
        <Text typography="EuclidCircularA-Medium" style={styles.text}>
          {t('credential.issuerInstructions')}
        </Text>
        <Text typography="EuclidCircularA-Medium" style={styles.issuerName}>
          {t('credential.citizenship')}
        </Text>
        <Picker
          style={styles.pickerContainer}
          itemStyle={styles.pickerItem}
          selectedValue={selectedCountry}
          onValueChange={itemValue => setSelectedCountry(itemValue)}
        >
          {countries.map(country => (
            <Picker.Item
              key={country.code}
              label={`${country.name} ${getFlagEmoji(country.code)}`}
              value={country.code}
              style={styles.pickerItem}
            />
          ))}
        </Picker>
        <Text typography="EuclidCircularA-Medium" style={[styles.text, { marginBottom: 10 }]}>
          {t('credential.availableIssuers')}
        </Text>
        <CredentialIssuer
          connect={connect}
          service={unicIDService as ServiceInfo}
          tryToOpenURL={tryToOpenURL}
          goToConnectionDetails={goToConnectionDetails}
          goToChat={goToChat}
          agent={agent}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

export default IdentityCredentialIssuers
