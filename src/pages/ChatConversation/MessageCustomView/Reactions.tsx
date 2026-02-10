import React, { memo } from 'react'
import { View, Text as NativeText } from 'react-native'

import getStyles from './styles'

import { Text } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { ChatEntryRole, Reaction } from '@2060/model'

type Props = {
  role: ChatEntryRole
  reactions: Reaction[]
}

interface GroupedReaction extends Reaction {
  quantity: number
}

const getReactionsGrouped = (reactions: Reaction[]) => {
  const groupedReactions: GroupedReaction[] = []
  reactions.forEach(reaction => {
    const reactionAlreadyIsAddedIndex = groupedReactions.findIndex(
      groupedReaction => groupedReaction.emoji === reaction.emoji,
    )
    if (reactionAlreadyIsAddedIndex >= 0) {
      const currentReaction = groupedReactions[reactionAlreadyIsAddedIndex]
      groupedReactions[reactionAlreadyIsAddedIndex] = {
        ...currentReaction,
        quantity: currentReaction.quantity + 1,
      }
    } else {
      groupedReactions.push({ ...reaction, quantity: 1 })
    }
  })
  return groupedReactions
}

const Reactions = ({ role: role, reactions }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  const reactionsGrouped = getReactionsGrouped(reactions)
  const containerStyle =
    role === ChatEntryRole.Sender
      ? styles.reactionsContainerStyleForSender
      : styles.reactionsContainerStyleForReceiver

  return (
    <View style={[styles.reactionsContainer, containerStyle]}>
      {reactionsGrouped.map(reaction => (
        <View style={styles.reactionContainer} key={reaction.emoji}>
          <NativeText key={reaction.emoji} style={styles.reactionEmoji}>
            {reaction.emoji}
          </NativeText>
          {reaction.quantity > 1 && <Text style={styles.reactionEmojiQuantity}>{reaction.quantity}</Text>}
        </View>
      ))}
    </View>
  )
}

export default memo(Reactions)
