import SvgIcon, { IconsNames } from '@src/components/common/SvgIcon'
import Text from '@src/components/common/Text'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import React from 'react'
import { TouchableOpacity, View } from 'react-native'
import { Props } from '../Props'
import getStyles from './styles'

const OutlinedGreenButton = ({ iconName, text, ...buttonProps }: Props) => {
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

export default OutlinedGreenButton
