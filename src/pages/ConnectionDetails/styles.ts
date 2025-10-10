import { StyleSheet } from 'react-native'

import { AppTheme, cardStyles, cardShadowStyles } from '@2060/styles'
import { hexTransparency } from '@2060/utils/colorUtils'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    subContainer: {
      paddingHorizontal: 15,
      paddingBottom: 10,
    },
    containerSectionInfo: {
      alignSelf: 'center',
      paddingHorizontal: 15,
    },
    mainInfoContainer: {
      marginVertical: 20,
    },
    relatedConnectionContainer: {
      alignItems: 'center',
    },
    displayName: {
      flex: 1,
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.md2,
    },
    nameContainer: {
      ...cardStyles(theme),
      ...cardShadowStyles(theme.colors),
      flexDirection: 'row',
      paddingVertical: 12,
      alignItems: 'center',
      marginBottom: 20,
    },
    createdAtText: {
      fontSize: theme.fontSize.md,
      color: theme.colors.secondaryText,
      textAlign: 'center',
    },
    containerAvatar: {
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      marginBottom: 10,
    },
    statusMainContainer: {
      marginBottom: 20,
      borderRadius: 8,
      borderWidth: 1.3,
      padding: 12,
    },
    blockedContainer: {
      backgroundColor: hexTransparency(theme.colors.red, theme.isDarkMode ? '2E' : '1A'),
      borderColor: theme.colors.red,
    },
    waitingContainer: {
      backgroundColor: hexTransparency(theme.colors.orange, theme.isDarkMode ? '2E' : '1A'),
      borderColor: theme.colors.orange,
    },
    blockedText: {
      color: theme.colors.red,
      fontSize: theme.fontSize.md,
      textAlign: 'center',
    },
    accountText: {
      color: theme.colors.green,
      fontSize: theme.fontSize.md,
      marginRight: 10,
    },
    divisor: {
      marginBottom: 15,
    },
    pendingText: {
      color: theme.colors.orange,
      fontSize: theme.fontSize.md,
      textAlign: 'center',
    },
    connectionRelatedToText: {
      fontSize: theme.fontSize.md2,
      color: theme.colors.primaryText,
      textAlign: 'center',
    },
    connectionRelatedToImg: {
      width: 30,
      height: 30,
      marginLeft: 5,
    },
    headerRight: {
      paddingRight: 10,
    },
    headerBtnText: {
      fontSize: theme.fontSize.md2,
      color: theme.colors.green,
    },
  })
