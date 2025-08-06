import { StyleSheet } from 'react-native'

import getCommonStyles from '../commonStyles'

import { AppTheme } from '@2060/styles'
import { waterColor } from '@2060/utils/colorUtils'

export default (theme: AppTheme) => {
  const commonStyles = getCommonStyles(theme)
  return StyleSheet.create({
    container: {
      ...commonStyles.buttonContainer,
      borderWidth: 1.5,
      backgroundColor: theme.isDarkMode ? waterColor(theme.colors.green) : theme.colors.white,
      borderColor: theme.colors.green,
    },
    iconContainer: {
      ...commonStyles.iconContainer,
    },
    text: {
      ...commonStyles.text,
      color: theme.isDarkMode ? theme.colors.white : theme.colors.green,
    },
  })
}
