import React from 'react'
import { TouchableOpacity, TouchableOpacityProps, StyleSheet, Text } from 'react-native'

interface Props extends TouchableOpacityProps {
  data: { emoji: string }
  isEmojiSelected: boolean
}

const EmojiItem: React.FC<Props> = ({ data, isEmojiSelected, ...rest }) => {
  const emojiStyle = isEmojiSelected ? styles.iconSizeSelected : styles.iconSize
  return (
    <TouchableOpacity {...rest} style={[styles.root, isEmojiSelected && styles.emojiSelected]}>
      <Text style={[emojiStyle, { includeFontPadding: false }]}>{data.emoji}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  root: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSize: {
    fontSize: 16,
    color: 'black',
  },
  iconSizeSelected: {
    fontSize: 22,
    color: 'black',
  },
  emojiSelected: {
    backgroundColor: '#eee',
    width: 35,
    height: 35,
    borderRadius: 17,
  },
})

export default EmojiItem
