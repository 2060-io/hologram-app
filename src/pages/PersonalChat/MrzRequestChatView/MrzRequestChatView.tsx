import React from 'react'
import { View, Text, Button } from 'react-native'

import { Props } from './MrzRequestChatViewProps'
import getStyles from './styles'

import { useChat, useMobileAgent } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { log } from '@2060/utils'

const MrzRequestChatView = (_props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { agent } = useMobileAgent()
  const { chatThread } = useChat()

  const scan = () => {
    log('Scan pressed')
    agent?.modules.mrtd.sendMrzString({
      mrzData: [
        'I<UTOD23145890<1233<<<<<<<<<<<',
        '7408122F1204159UTO<<<<<<<<<<<6',
        'ERIKSSON<<ANNA<MARIA<<<<<<<<<<',
      ],
      connectionId: chatThread?.data.connectionId!,
    })
  }

  return (
    <View style={styles.container}>
      <Text>{'MRZ Request'}</Text>
      <Button title="Scan" onPress={scan} />
    </View>
  )
}

export default MrzRequestChatView
