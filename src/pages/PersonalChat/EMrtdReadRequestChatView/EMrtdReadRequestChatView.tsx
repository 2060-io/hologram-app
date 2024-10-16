import React from 'react'
import { View, Text, Button } from 'react-native'
import EIdReader from 'react-native-eid-reader'

import { Props } from './EMrtdReadRequestChatViewProps'
import getStyles from './styles'

import { useChat, useMobileAgent } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { log } from '@2060/utils'

const EMrtdReadRequestChatView = (_props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { agent } = useMobileAgent()
  const { chatThread } = useChat()

  const scan = async () => {
    const mrzInfo = _props.metadata?.mrzInfo
    log(`Scan pressed. MRZ info: ${JSON.stringify(mrzInfo)}`)
    if (!mrzInfo) return
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

    await agent?.modules.mrtd.sendEMrtdData({
      connectionId: chatThread?.data.connectionId!,
      dataGroups: result.dataGroupsBase64,
    })
  }

  return (
    <View style={styles.container}>
      <Text>{'eMRTD Read Request'}</Text>
      <Button title="Scan" onPress={scan} />
    </View>
  )
}

export default EMrtdReadRequestChatView
