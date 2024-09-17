import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { PeerSecuritySystemMessageProps } from './Props'
import getStyles from './styles'

import { SvgIcon, Text } from '@2060/components/common'
import { useConnectionById } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { getConnectionParentId } from '@2060/utils/connectionUtils'

const PeerSecuritySystemMessage = ({ connection }: PeerSecuritySystemMessageProps) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const parentConnection = useConnectionById(getConnectionParentId(connection))
  const parentConnectionDisplayName = parentConnection?.theirLabel
  const translationKey = parentConnectionDisplayName
    ? t('personalChat.securityMessageSubConnect', { parentConnectionDisplayName })
    : t('personalChat.securityMessagePeer')

  return (
    <View style={[styles.containerSecurityMessage]}>
      <Trans
        i18nKey={translationKey}
        typography="EuclidCircularA-Regular"
        style={styles.textMessage}
        parent={Text}
        components={{
          lock: <SvgIcon name="lock" fill={styles.textMessage.color} width={12} height={12} />,
          bold: <Text typography="EuclidCircularA-Bold" style={styles.textMessage} />,
        }}
      />
    </View>
  )
}

export default PeerSecuritySystemMessage
