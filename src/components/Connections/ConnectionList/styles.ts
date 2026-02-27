import { StyleSheet } from 'react-native'

import { AppTheme } from '@src/styles'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      height: '100%',
    },
    sectionHeaderLabel: {
      fontSize: theme.fontSize.lg,
      color: theme.colors.primaryText,
      textTransform: 'uppercase',
      paddingVertical: 12,
      paddingLeft: 10,
    },
    containerConnection: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      paddingVertical: 6,
      paddingLeft: 10,
      paddingRight: 8,
    },
    lastConnectionInSection: {
      marginBottom: 0,
    },
    rightSideContainer: {
      height: '100%',
      flexDirection: 'row',
      alignItems: 'center',
    },
    connectionsMatchedContainer: {
      width: 20,
      height: 20,
      borderRadius: 50,
      backgroundColor: theme.colors.green,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    connectionsMatchedText: {
      fontSize: theme.fontSize.md,
      color: theme.colors.primary,
      textAlign: 'center',
    },
    containerVerifiedMark: {
      width: 15,
      height: 15,
      position: 'absolute',
      top: 4,
      left: 4,
      zIndex: 1,
    },
    listItemText: {
      flex: 1,
      fontSize: theme.fontSize.md2,
      color: theme.colors.primaryText,
      paddingLeft: 12,
    },
    numberSubConnect: {
      color: theme.colors.secondaryGrey,
      fontSize: theme.fontSize.md2,
    },
    containerSectionList: {
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      paddingVertical: 8,
      paddingLeft: 10,
      paddingRight: 8,
    },
    textEmpty: {
      marginTop: 15,
      paddingHorizontal: 15,
      fontSize: theme.fontSize.md,
      textAlign: 'center',
      color: theme.colors.primaryText,
    },
    selected: {
      borderRadius: 9,
      borderWidth: 1.4,
      borderColor: theme.colors.green,
    },
  })
