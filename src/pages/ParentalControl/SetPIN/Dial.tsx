import React from 'react'
import { View, TouchableOpacity } from 'react-native'

import getStyles, { DIAL_SIZE } from './dialStyles'

import { Icon, Text } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'

type Props = {
  dial: number | string
  onDialPressed(pin: number | string): void
}

const Dial = ({ dial, onDialPressed }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  return dial === '' ? (
    <View style={styles.empty} />
  ) : (
    <TouchableOpacity onPress={() => onDialPressed(dial)} style={styles.buttonContainer}>
      {dial === 'del' ? (
        <Icon as="Ionicons" name="backspace-outline" color={theme.colors.tertiaryText} size={DIAL_SIZE} />
      ) : (
        <Text fontFamily="EuclidCircularA-SemiBold" style={styles.dialText}>
          {dial}
        </Text>
      )}
    </TouchableOpacity>
  )
}

export default Dial
