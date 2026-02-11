import { StyleSheet } from 'react-native'

import { AppTheme } from '@src/styles'
import { widthPercentageToDP } from '@src/utils/responsiveUtils'

const styles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    subContainer: {
      marginTop: 15,
      paddingHorizontal: 15,
      paddingBottom: 10,
    },
    headerBtnText: {
      fontSize: theme.fontSize.md2,
      color: theme.colors.green,
    },
    headerLeft: {
      paddingLeft: 15,
    },
    headerRight: {
      paddingRight: 15,
    },
    credentialTitle: {
      fontSize: theme.fontSize.md,
      color: theme.colors.primaryText,
      textAlign: 'center',
    },
    verifiableCredentialText: {
      marginBottom: 15,
    },
    containerSectionIssuerInfo: {
      alignSelf: 'center',
      width: widthPercentageToDP('92%'),
    },
    titleIssuerInfo: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.lg,
      marginTop: 20,
      marginBottom: 15,
    },
  })

export default styles
