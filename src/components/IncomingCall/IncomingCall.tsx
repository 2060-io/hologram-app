import React from 'react'
import { useTranslation } from 'react-i18next'
import { View, SafeAreaView } from 'react-native'

import { CallButton, AnswerButton, HangupButton, Avatar, Text } from '../common'

import getStyles from './styles'

import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { useVideoCallContext } from '@2060/hooks/providers/useVideoCallContext'
import { getConnectionDisplayName, getConnectionDisplayPicture } from '@2060/utils/connectionUtils'

const IncomingCall = () => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { t } = useTranslation()
  const { answerIncomingCall, rejectIncomingCall, didcommConnection, isCameraOn, handleCamera, isVideoCall } =
    useVideoCallContext()

  const displayPicture = didcommConnection ? getConnectionDisplayPicture(didcommConnection) : undefined
  const connectionName = didcommConnection ? getConnectionDisplayName(didcommConnection) : undefined

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.subContainer}>
        <Avatar uri={displayPicture} label={connectionName} size="46%" />
        <Text typography="EuclidCircularA-Medium" style={styles.textConnectionName}>
          {connectionName}
        </Text>
      </View>
      <View style={styles.answerWithoutVideoContainer}>
        {isVideoCall && (
          <CallButton
            text={t('call.answerWithoutVideo')}
            iconName={isCameraOn ? 'video' : 'videoOff'}
            onPress={() => handleCamera()}
          />
        )}
      </View>
      <View style={styles.buttonsSubContainer}>
        <HangupButton onPress={rejectIncomingCall} />
        <AnswerButton onPress={answerIncomingCall} />
      </View>
    </SafeAreaView>
  )
}

export default IncomingCall
