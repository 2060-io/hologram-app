import React from 'react'
import { View, TouchableOpacity } from 'react-native'

import { Props } from '../Props'

import getStyles from './styles'

import SvgIcon, { IconsNames } from '@2060/components/common/SvgIcon'
import Text from '@2060/components/common/Text'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'

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
      <Text typography="EuclidCircularA-Medium" style={styles.text}>
        {text}
      </Text>
    </TouchableOpacity>
  )
}

export default OutlinedButton
