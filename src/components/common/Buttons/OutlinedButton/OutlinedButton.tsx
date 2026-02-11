import React from 'react'
import { View, TouchableOpacity } from 'react-native'

import { Props } from '../Props'

import getStyles from './styles'

import SvgIcon, { IconsNames } from '@src/components/common/SvgIcon'
import Text from '@src/components/common/Text'
import { useTheme } from '@src/hooks/providers/ThemeProvider'

const OutlinedButton = ({ iconName, text, ...buttonProps }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const style = [styles.container, buttonProps?.style]
  return (
    <TouchableOpacity {...buttonProps} style={style}>
      {iconName && (
        <View style={styles.iconContainer}>
          <SvgIcon name={iconName as keyof IconsNames} fill={theme.colors.white} />
        </View>
      )}
      <Text fontFamily="EuclidCircularA-Medium" style={styles.text}>
        {text}
      </Text>
    </TouchableOpacity>
  )
}

export default OutlinedButton
