import React, { memo } from 'react'
import { View, ViewStyle } from 'react-native'

import { ParsedText } from '../components'

import getStyles from './styles'

import { useTheme } from '@src/hooks/providers/ThemeProvider'

type Props = {
  text: string
  renderTimeAndTicks: (containerStyle: ViewStyle) => false | React.JSX.Element
}

const MessageTextView: React.FC<Props> = memo(({ text, renderTimeAndTicks }) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <ParsedText theme={theme} text={text} />
      </View>
      {renderTimeAndTicks(styles.containerAckAndTime)}
    </View>
  )
})

export default MessageTextView
