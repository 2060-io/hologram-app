import { AppTheme } from '@src/styles'
import { screenWidth, widthPercentageToDP } from '@src/utils/responsiveUtils'
import { StyleSheet } from 'react-native'

const styles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      marginTop: 12,
    },
    searchInputContainer: {
      width: widthPercentageToDP('95%'),
      alignSelf: 'center',
    },
    headerRight: {
      paddingRight: 15,
    },
    noCredentialsContainer: {
      alignItems: 'center',
    },
    noCredentialsMessage: {
      fontSize: theme.fontSize.md,
      textAlign: 'center',
    },
    noCredentialCardSkeleton: {
      width: screenWidth,
      height: screenWidth * 0.6,
    },
    noCredentialsMessageP1: {
      color: theme.colors.primaryText,
    },
    nestedCardSkeletonContainer: {
      marginTop: -screenWidth * 0.35,
    },
  })

export default styles
