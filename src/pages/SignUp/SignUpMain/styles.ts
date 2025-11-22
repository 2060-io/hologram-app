import { StyleSheet } from 'react-native'

import { AppTheme, cardShadowStyles, cardStyles } from '@2060/styles'
import { widthPercentageToDP } from '@2060/utils/responsiveUtils'

const styles = (theme: AppTheme) =>
  StyleSheet.create({
    root: {
      flex: 1,
    },
    innerRoot: {
      flexGrow: 1,
    },
    contentContainerStyle: {
      flexGrow: 1,
    },
    containerAppLogo: {
      paddingTop: 60,
    },
    title: {
      fontSize: theme.fontSize.xl + 3,
      color: theme.colors.primaryText,
      marginTop: 34,
      marginBottom: 26,
      textAlign: 'center',
    },
    subTitle: {
      color: theme.colors.secondaryText,
      fontSize: theme.fontSize.lg + 1,
      textAlign: 'center',
      marginBottom: 26,
    },
    containerNavigationOptions: {
      ...cardStyles(theme),
      ...cardShadowStyles(theme.colors),
      borderRadius: 9,
      padding: 0,
      width: widthPercentageToDP('92%'),
      alignSelf: 'center',
    },
    containerOption: {
      width: '100%',
      paddingHorizontal: 15,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
    },
    itemSeparator: {
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(106, 137, 148, 0.16)',
    },
    containerIconChevronForward: {
      flex: 1,
      alignItems: 'flex-end',
      justifyContent: 'center',
    },
    optionText: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.md + 1,
      paddingLeft: 13.5,
      textAlign: 'left',
    },
    appVersionText: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.sm,
      position: 'absolute',
      right: 5,
      bottom: 0,
    },
  })

export default styles
