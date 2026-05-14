import { Icon } from '@src/components/common'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { ChatEntryRole } from '@src/model'
import { ChatEntryMessage } from '@src/pages/Chat/ChatMessage/Props'
import React, { memo, useState } from 'react'
import { TouchableOpacity, View } from 'react-native'
import EmojiPicker from 'rn-emoji-keyboard'
import EmojiItem from './EmojiItem'
import getStyles from './styles'

const mainEmojis = [
  { emoji: '😂', name: 'laugh' },
  { emoji: '👍🏻', name: 'good' },
  { emoji: '❤️', name: 'heart' },
  { emoji: '😮', name: 'astonished' },
  { emoji: '😢', name: 'sad' },
  { emoji: '🙏🏻', name: 'thanks' },
]

type Props = {
  message: ChatEntryMessage
  onReaction(action: 'react' | 'unreact', emoji: string): void
  onClose(): void
}

type Emoji = {
  emoji: string
  name: string
}

const ReactionMenu = ({ message, onClose, onReaction }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const [isOpen, setIsOpen] = useState(false)

  const handleOnCloseEmojiPicker = () => setIsOpen(false)
  const handleOnshowEmojiPicker = () => setIsOpen(true)

  const handleOnEmojiSelected = (emoji: Emoji) => {
    const isEmojiAlreadySelected = getIsEmojiSelected(emoji.emoji)
    const action = isEmojiAlreadySelected ? 'unreact' : 'react'
    onReaction(action, emoji.emoji)
    onClose()
  }

  const getIsEmojiSelected = (emoji: string) => {
    const exists = message.reactions.find(
      (reaction) => reaction.emoji === emoji && reaction.role === ChatEntryRole.Sender
    )
    return Boolean(exists)
  }

  return (
    <View style={styles.root}>
      <EmojiPicker
        open={isOpen}
        onClose={handleOnCloseEmojiPicker}
        onEmojiSelected={handleOnEmojiSelected}
        expandable={false}
        enableRecentlyUsed
        categoryPosition="top"
      />
      <View style={styles.emojiBox}>
        {mainEmojis.map((emoji) => (
          <EmojiItem
            onPress={() => handleOnEmojiSelected(emoji)}
            key={emoji.name}
            data={emoji}
            isEmojiSelected={getIsEmojiSelected(emoji.emoji)}
          />
        ))}
        <TouchableOpacity onPress={handleOnshowEmojiPicker} activeOpacity={0.7} style={styles.iconEllipsis}>
          <Icon as="Ionicons" name="add" color={theme.colors.blue} size={25} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default memo(ReactionMenu)
