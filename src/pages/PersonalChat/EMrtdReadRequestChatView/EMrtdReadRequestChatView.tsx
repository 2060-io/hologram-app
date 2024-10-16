import React from 'react'
import { View, Text, Button } from 'react-native'
import EIdReader from 'react-native-eid-reader'

import { Props } from './EMrtdReadRequestChatViewProps'
import getStyles from './styles'

import { useChat, useMobileAgent } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { log } from '@2060/utils'
import { toast } from '@2060/utils/toast'

const EMrtdReadRequestChatView = (_props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { agent } = useMobileAgent()
  const { chatThread } = useChat()
  const { didcommThreadId } = _props

  const scan = async () => {
    let mrzInfo = _props.metadata?.mrzInfo
    log(`Scan pressed. MRZ info: ${JSON.stringify(mrzInfo)}`)
    if (!mrzInfo) {
      toast({ type: 'error', message: 'Cannot find MRZ info' })
      return
    }
    try {
      const result = await EIdReader.startReading({
        mrzInfo: {
          birthDate: mrzInfo.birthDate,
          documentNumber: mrzInfo.documentNumber,
          expirationDate: mrzInfo.expirationDate,
        },
        includeRawData: true,
        includeImages: true,
      })
      log(`status: ${result.status}`)
      log(`result: ${JSON.stringify(result)}`)
      if (result.status === 'OK') {
        toast({ type: 'success', message: `Passport ${result.data.documentNo} read successfully` })
        await agent?.modules.mrtd.sendEMrtdData({
          connectionId: chatThread?.data.connectionId!,
          dataGroups: result.dataGroupsBase64,
          threadId: didcommThreadId,
        })
      } else {
        toast({ type: 'warning', message: `Passport read aborted. Status: ${result.status}` })
      }
    } catch (error) {
      toast({ type: 'error', message: `Error: ${(error as Error).message}` })
    }
  }
  return (
    <View style={styles.container}>
      <Text>{`eMRTD Read Request (${_props.metadata?.state})`}</Text>
      <Button title="Scan" onPress={scan} />
    </View>
  )
}

export default EMrtdReadRequestChatView
