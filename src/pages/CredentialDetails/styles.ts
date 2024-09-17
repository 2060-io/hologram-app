import { StyleSheet } from 'react-native'

import { cardStyles, cardShadowStyles } from '../../styles/globalStyles'

import { AppTheme } from '@2060/styles'

const styles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    subContainer: {
      flex: 1,
      paddingTop: 15,
      paddingHorizontal: 15,
    },
    containerCardBtnDelete: {
      ...cardStyles(theme),
      ...cardShadowStyles(theme.colors),
      width: '100%',
      padding: 10,
      marginVertical: 20,
    },
    containerBtnDelete: {
      flexDirection: 'row',
    },
    titleIssuerInfo: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.lg,
      marginTop: 20,
      marginBottom: 15,
    },
    optionText: {
      fontSize: theme.fontSize.md2,
      color: theme.colors.primaryText,
      marginLeft: 10,
    },
  })

export default styles
