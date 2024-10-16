import React, { useState } from 'react'
import { View, Button } from 'react-native'

import { Props } from './MrzRequestChatViewProps'
import getStyles from './styles'

import { Modal, MRZScanner, Text } from '@2060/components/common'
import { MRZProperties } from '@2060/components/common/MRZScanner/utils/mrzProperties'
import { useChat, useMobileAgent } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { log } from '@2060/utils'
import { handleCameraPermission } from '@2060/utils/permissions'
import { toast } from '@2060/utils/toast'

const MrzRequestChatView = (_props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { agent } = useMobileAgent()
  const { chatThread } = useChat()
  const [displayScanMrz, setDisplayMrz] = useState(false)

  const handleScanMrz = async () => {
    const cameraPermission = await handleCameraPermission()
    if (!cameraPermission) return
    setDisplayMrz(true)
  }

  const onMRZFinalResults = async (mrzFinalResults: MRZProperties) => {
    setDisplayMrz(false)
    log('MRZ Result', JSON.stringify(mrzFinalResults, null, 2))
    agent?.modules.mrtd.sendMrzString({
      mrzData: mrzFinalResults.docMRZ,
      connectionId: chatThread?.data.connectionId!,
      threadId: _props.didcommThreadId,
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
      <Text>{`MRZ Request (${_props.metadata?.state})`}</Text>
      <Button title="Scan" onPress={handleScanMrz} />
    </View>
  )
}

export default MrzRequestChatView
