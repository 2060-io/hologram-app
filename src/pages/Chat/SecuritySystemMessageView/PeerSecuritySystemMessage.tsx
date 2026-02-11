import React from 'react'
import { Trans } from 'react-i18next'
import { View } from 'react-native'

import { PeerSecuritySystemMessageProps } from './Props'
import getStyles from './styles'

import { SvgIcon, Text } from '@src/components/common'
import { useConnectionById } from '@src/hooks/agent'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { getConnectionParentId } from '@src/utils/connectionUtils'

const PeerSecuritySystemMessage = ({ connection }: PeerSecuritySystemMessageProps) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const parentConnection = useConnectionById(getConnectionParentId(connection))
  const parentConnectionDisplayName = parentConnection?.theirLabel
  const translationKey = parentConnectionDisplayName
    ? 'chat.securityMessageSubConnect'
    : 'chat.securityMessagePeer'

  return (
    <View style={[styles.containerSecurityMessage]}>
      <Trans
        i18nKey={translationKey}
        style={styles.textMessage}
        parent={Text}
        components={{
          lock: <SvgIcon name="lock" fill={styles.textMessage.color} width={12} height={12} />,
          bold: <Text fontFamily="EuclidCircularA-Bold" style={styles.textMessage} />,
        }}
        values={{ ...(parentConnectionDisplayName && { parentConnectionDisplayName }) }}
      />
    </View>
  )
}

export default PeerSecuritySystemMessage
