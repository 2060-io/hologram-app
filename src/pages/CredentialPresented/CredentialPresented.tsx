import { StackActions } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { View, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native'
import { uses24HourClock } from 'react-native-localize'

import getStyles from './styles'

import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { Avatar, CredentialMainInformation, SvgIcon, Text } from '@2060/components/common'
import { useChats, useMobileAgent } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { dateToString } from '@2060/utils/dateUtils'

interface Props extends StackScreenProps<NavigationStackParams, 'CredentialPresented'> {}

const CredentialPresented = ({ navigation, route }: Props) => {
  const { verifier, credentials, presentedAt } = route.params
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { agent } = useMobileAgent()
  const { findOrCreateThread } = useChats()
  const using24HourFormat = uses24HourClock()

  const goToChatScreen = async () => {
    if (!agent) return
    const connections = await agent.connections.findByInvitationDid(verifier.did)
    if (connections.length) {
      const [connection] = connections
      const chatThreadId = findOrCreateThread({ connection }).id
      navigation.dispatch(
        StackActions.replace('PersonalChatStack', { screen: 'PersonalChat', params: { chatThreadId } }),
      )
    }
  }

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity style={styles.headerRight} onPress={goToChatScreen}>
          <Text fontFamily="EuclidCircularA-Medium" style={styles.headerRightText}>
            {t('general.done')}
          </Text>
        </TouchableOpacity>
      ),
    })
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.subContainer}>
          <SvgIcon fill={theme.colors.green} name="done" width={64} height={64} />
          <Text style={[styles.title, styles.mainTitle]}>
            {t('presentationRequest.successfullyReceived')}
            <Text style={styles.title} fontFamily="EuclidCircularA-SemiBold">
              {verifier.name}
            </Text>
          </Text>
          {credentials.map(credential => (
            <CredentialMainInformation key={credential.id} credentialMainInfo={credential} />
          ))}
          <View style={styles.card}>
            <View style={styles.presentedDateContainer}>
              <SvgIcon fill={theme.isDarkMode ? theme.colors.secondaryGrey : '#6A8994'} name="personSquare" />
              <View style={styles.presentedDateText}>
                <Text fontFamily="EuclidCircularA-Bold" style={styles.presentedText}>
                  {t('presentationRequest.presented')}
                </Text>
                <Text style={styles.presentedText}>
                  {dateToString(presentedAt, `DD-MM-YYYY ${using24HourFormat ? 'HH:mm' : 'h:mm A'}`)}
                </Text>
              </View>
            </View>
            <View style={styles.issuerContainer}>
              <Avatar uri={verifier.logoUrl} label={verifier.name} size="13%" />
              <Text fontFamily="EuclidCircularA-Medium" style={styles.verifierName}>
                {verifier.name}
              </Text>
            </View>
            <TouchableOpacity style={styles.viewInChatButton} onPress={goToChatScreen}>
              <Text style={styles.viewInChatText}>{t('presentationRequest.viewInChat')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default CredentialPresented
