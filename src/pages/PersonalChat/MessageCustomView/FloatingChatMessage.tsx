import React, { memo } from 'react'
import { View } from 'react-native'

import BaseCustomView from './BaseCustomView'
import Reactions from './Reactions'
import getStyles, { REACTIONS_MARGIN_BOTTOM } from './styles'
import { ROUND_BORDER } from './utils'

import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { ChatEntryRole, ChatEntryState } from '@src/model'
import { FloatingChatMessageProps } from '@src/pages/PersonalChat/ChatMessage/Props'

const FloatingChatMessage: React.FC<FloatingChatMessageProps> = memo(props => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const chatEntry = props.currentMessage
  const isSender = chatEntry.role === ChatEntryRole.Sender
  const borders = { borderRadius: ROUND_BORDER }
  const position: 'right' | 'left' = isSender ? 'right' : 'left'
  const hasReactions = !!chatEntry.reactions.length
  const containerMarginBottom = hasReactions ? REACTIONS_MARGIN_BOTTOM + 12 : 12

  return (
    <View style={[styles.floatingMessageContainer, props.style, { marginBottom: containerMarginBottom }]}>
      <View
        style={[styles.subContainer, styles[`${position}SubContainer`], { ...borders }]}
        pointerEvents="none"
      >
        <BaseCustomView {...props} borders={borders} />
      </View>
      {!!chatEntry.reactions.length && chatEntry.state !== ChatEntryState.Deleted && (
        <Reactions role={chatEntry.role} reactions={chatEntry.reactions} />
      )}
    </View>
  )
})

export default FloatingChatMessage
