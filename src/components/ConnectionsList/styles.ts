import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      height: '100%',
    },
    sectionHeaderLabel: {
      fontSize: theme.fontSize.lg,
      color: theme.colors.primaryText,
      fontFamily: 'EuclidCircularA-Medium',
      textTransform: 'uppercase',
      paddingVertical: 12,
      paddingLeft: 10,
    },
    containerConnection: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
    },
    lastConnectionInSection: {
      paddingBottom: 0,
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
      left: -6,
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
      paddingVertical: 10,
      paddingLeft: 21,
      paddingRight: 17,
    },
    textEmpty: {
      marginTop: 15,
      paddingHorizontal: 15,
      fontSize: theme.fontSize.md,
      textAlign: 'center',
      color: theme.colors.primaryText,
    },
    radioButton: {
      marginLeft: 10,
    },
  })
