import React from 'react'
import { View } from 'react-native'

import getStyles from './styles'

import { Text } from '@src/components/common'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { getFormattedDateRange, getIsSameDay } from '@src/utils/dateUtils'

type Props = {
  currentMessageCreatedAt: number
  previousMessageCreatedAt?: number
}

const isSameDay = (date1: number, date2: number | undefined) => {
  if (!date2) return false
  return getIsSameDay(date1, date2)
}

const DateByTimeRangeView = ({ currentMessageCreatedAt, previousMessageCreatedAt }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  if (isSameDay(currentMessageCreatedAt, previousMessageCreatedAt)) {
    return null
  }

  return (
    <View style={styles.containerDay}>
      <Text style={styles.textDay}>{getFormattedDateRange(new Date(currentMessageCreatedAt))}</Text>
    </View>
  )
}

export default DateByTimeRangeView
