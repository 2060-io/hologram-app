import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { BlueButton, Header } from '../components'

import { Props } from './MrzRequestChatViewProps'
import getStyles from './styles'

import { MRZScanner } from '@2060/components'
import { Modal, Text } from '@2060/components/common'
import { useChat, useMobileAgent } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { MrzRequestState } from '@2060/model'
import { handleCameraPermission } from '@2060/utils/permissions'
import { toast } from '@2060/utils/toast'

const MrzRequestChatView = (props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { t } = useTranslation()
  const { agent } = useMobileAgent()
  const { chatThread } = useChat()
  const [displayScanMrz, setDisplayMrz] = useState(false)
  const canScanMrz = props.metadata?.state === 'received'

  const stateToText: Record<MrzRequestState, string> = {
    aborted: t('chat.mrzAborted'),
    received: t('navigation.Scan'),
    scanned: t('chat.mrzScanned'),
  }

  const handleScanMrz = async () => {
    const cameraPermission = await handleCameraPermission()
    if (!cameraPermission) return
    setDisplayMrz(true)
  }

  const onMRZFinalResults = async (mrzFinalResults: string[]) => {
    setDisplayMrz(false)
    agent?.modules.mrtd.sendMrzString({
      mrzData: mrzFinalResults.join('\n'),
      connectionId: chatThread?.data.connectionId!,
      threadId: props.didcommThreadId,
    })
    toast({ type: 'success', message: 'MRZ scanned and sent' })
  }

  const onSkipPressed = () => {
    setDisplayMrz(false)
  }

  return (
    <View style={styles.container}>
      <Modal visible={displayScanMrz}>
        <MRZScanner onMRZFinalResults={onMRZFinalResults} onSkipPressed={onSkipPressed} />
      </Modal>
      <Header theme={theme} title={t('chat.mrzRequest')} leftIconName="scan" />
      <View style={styles.subContainer}>
        <Text style={styles.title} typography="EuclidCircularA-Regular">
          Please scan your mrz
        </Text>
      </View>
      <BlueButton
        style={{ opacity: canScanMrz ? 1 : 0.5, marginHorizontal: 6 }}
        text={props.metadata?.state ? stateToText[props.metadata.state] : ''}
        onPress={handleScanMrz}
        disabled={!canScanMrz}
      />
    </View>
  )
}

export default MrzRequestChatView
