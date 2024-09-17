import { StyleSheet } from 'react-native'

import getCommonStyles from '../commonStyles'

import { AppTheme } from '@2060/styles'

export default (theme: AppTheme) => {
  const commonStyles = getCommonStyles(theme)
  return StyleSheet.create({
    container: {
      ...commonStyles.buttonContainer,
      borderWidth: 1.5,
      borderColor: theme.colors.tertiaryText,
    },
    iconContainer: {
      ...commonStyles.iconContainer,
    },
    text: {
      ...commonStyles.text,
      color: theme.colors.tertiaryText,
    },
  })
}
