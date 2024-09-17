import React from 'react'
import { View } from 'react-native'

import { isSameDay } from '../utils'

import getStyles from './styles'

import { Text } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { ChatEntryMessage } from '@2060/pages/PersonalChat/ChatMessage/Props'
import { getFormattedDateRange } from '@2060/utils/dateUtils'

export type Props = {
  currentMessage?: ChatEntryMessage
  previousMessage?: ChatEntryMessage
}

const DateByTimeRangeView = ({ currentMessage, previousMessage }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  if (currentMessage == null || isSameDay(currentMessage, previousMessage)) {
    return null
  }

  return (
    <View style={styles.containerDay}>
      <Text typography="EuclidCircularA-Regular" style={styles.textDay}>
        {getFormattedDateRange(new Date(currentMessage.createdAt))}
      </Text>
    </View>
  )
}

export default DateByTimeRangeView
