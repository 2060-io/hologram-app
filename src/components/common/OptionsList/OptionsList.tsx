import SvgIcon from '@src/components/common/SvgIcon'
import Text from '@src/components/common/Text'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import React from 'react'
import { TouchableOpacity, View } from 'react-native'
import { Props } from './OptionsListProps'
import getStyles from './styles'

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
            {option.iconName && <SvgIcon name={option.iconName} fill={theme.colors.tertiaryText} style={styles.icon} />}
            <Text style={styles.text}>{option.text}</Text>
            {option?.rightContent?.()}
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

export default OptionsList
