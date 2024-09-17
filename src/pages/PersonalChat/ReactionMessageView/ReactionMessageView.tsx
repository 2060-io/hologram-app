import React from 'react'
import { View } from 'react-native'

import styles from './styles'

import { Text } from '@2060/components/common'

type Props = {
  emoji: string
  name: string
  isRoleSender: boolean
}

const ReactionMessageView: React.FC<Props> = ({ emoji, isRoleSender }) => {
  const left = isRoleSender ? 60 : 240
  return (
    <View style={[styles.root, { left }]}>
      <Text style={{ fontSize: 16 }}>{emoji}</Text>
    </View>
  )
}

export default ReactionMessageView
