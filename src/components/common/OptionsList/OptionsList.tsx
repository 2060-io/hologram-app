import React from 'react'
import { View, TouchableOpacity } from 'react-native'

import { Props } from './OptionsListProps'
import getStyles from './styles'

import SvgIcon, { IconsNames } from '@2060/components/common/SvgIcon'
import Text from '@2060/components/common/Text'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'

const OptionsList = ({ options }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  return (
    <View style={[styles.container]}>
      {options.map((option, index) => {
        const isNotLast = options.length !== index + 1
        return (
          <TouchableOpacity
            key={option.text}
            style={[styles.optionContainer, isNotLast && styles.itemSeparator]}
            onPress={option?.onPress}
          >
            {option.iconName && (
              <SvgIcon
                name={option.iconName as keyof IconsNames}
                fill={theme.colors.tertiaryText}
                style={styles.icon}
              />
            )}
            <Text typography="EuclidCircularA-Regular" style={styles.text}>
              {option.text}
            </Text>
            {option?.rightContent?.()}
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

export default OptionsList
