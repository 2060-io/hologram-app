import { Icon, Text } from '@src/components/common'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import React from 'react'
import { TouchableOpacity, View } from 'react-native'
import getStyles, { DIAL_SIZE } from './dialStyles'

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
