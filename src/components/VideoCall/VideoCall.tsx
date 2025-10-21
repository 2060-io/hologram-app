import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View, SafeAreaView } from 'react-native'

import { CallButton, Text, Avatar } from '../common'

import Connected from './Connected'
import getStyles from './styles'
import { useVideoCall } from './useVideoCall'

import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { CallStatus } from '@2060/hooks/providers/useVideoCallContext'
import { getConnectionDisplayPicture, getConnectionDisplayName } from '@2060/utils/connectionUtils'

const VideoCall = () => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { t } = useTranslation()
  const stateValues = useVideoCall()
  const { connectionStatus, didcommConnection, ...anotherStateValues } = stateValues

  const renderAvatar = useMemo(() => {
    if (!didcommConnection) return null
    const displayPicture = getConnectionDisplayPicture(didcommConnection)
    const connectionName = getConnectionDisplayName(didcommConnection)
    return (
      <>
        <Avatar uri={displayPicture} label={connectionName} size="46%" />
        <Text fontFamily="EuclidCircularA-Medium" style={styles.textConnectionName}>
          {connectionName}
        </Text>
      </>
    )
  }, [didcommConnection])

  return (
    <SafeAreaView style={styles.container}>
      {connectionStatus.status === CallStatus.Connecting && (
        <View style={styles.subContainer}>
          {renderAvatar}
          <Text style={styles.text}>{t('call.connecting')}</Text>
        </View>
      )}
      {connectionStatus.status === CallStatus.Connected && (
        <Connected renderAvatar={renderAvatar} {...anotherStateValues} />
      )}
      {connectionStatus.status === CallStatus.Disconnected && (
        <>
          <View style={styles.subContainer}>
            {renderAvatar}
            <Text style={styles.textConnectionLost}>{t('call.connectionLost')}</Text>
            <Text style={styles.text}>{t('call.reconnecting')}</Text>
          </View>
          <View style={styles.buttonsContainer}>
            <CallButton
              text={t('call.endCall')}
              iconName="phoneEnd"
              onPress={() => stateValues.finishCall()}
            />
          </View>
        </>
      )}
      {connectionStatus.status === CallStatus.Finished && (
        <View style={styles.subContainer}>
          {renderAvatar}
          <Text style={styles.text}>{connectionStatus.statusMessage}</Text>
        </View>
      )}
    </SafeAreaView>
  )
}

export default VideoCall
