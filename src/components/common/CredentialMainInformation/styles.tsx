import { AppTheme, cardShadowStyles, cardStyles } from '@src/styles'
import { screenWidth, widthPercentageToDP } from '@src/utils/responsiveUtils'
import { StyleSheet } from 'react-native'

const styles = (theme: AppTheme, size: string) => {
  const [width, height] = size === 'big' ? ['84%', '48%'] : ['72%', '43%']
  return StyleSheet.create({
    container: {
      ...cardStyles(theme),
      ...cardShadowStyles(theme.colors),
      width: widthPercentageToDP(width),
      height: widthPercentageToDP(height),
      justifyContent: 'space-between',
      alignSelf: 'center',
      marginBottom: 15,
    },
    subContainer: {
      flexDirection: 'row',
    },
    imageContainer: {
      flex: 3,
      justifyContent: 'center',
      alignItems: 'center',
    },
    image: {
      width: screenWidth * 0.15,
      height: screenWidth * 0.15,
    },
    nameContainer: {
      flex: 1,
      alignItems: 'flex-end',
    },
    name: {
      fontSize: theme.fontSize.lg + 2,
      color: theme.colors.primaryText,
      textAlign: 'right',
    },
    issuedOnContainer: {
      marginBottom: 5,
    },
    issuedOn: {
      fontSize: theme.fontSize.sm - 2,
      color: theme.colors.secondaryText,
    },
    bottomContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    bottomText: {
      maxWidth: '90%',
      marginRight: 10,
      fontSize: theme.fontSize.md - 1,
      color: theme.colors.primaryText,
    },
  })
}

export default styles
