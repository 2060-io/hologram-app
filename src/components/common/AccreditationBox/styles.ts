import { StyleSheet } from 'react-native'
import { VeranaCardColors } from '../ProofOfTrustCard/styles'

const getStyles = (colors: VeranaCardColors) =>
  StyleSheet.create({
    container: {
      borderRadius: 10,
      borderWidth: 1,
      marginTop: 14,
      padding: 10,
    },
    title: {
      color: colors.sub,
      fontSize: 11,
      letterSpacing: 1,
      marginBottom: 4,
    },
    schema: {
      color: colors.ink,
      fontSize: 14,
      marginBottom: 6,
    },
    verdict: {
      alignItems: 'center',
      flexDirection: 'row',
    },
    icon: {
      marginRight: 6,
    },
    text: {
      color: colors.askText,
      flex: 1,
      fontSize: 12,
    },
    retry: {
      color: colors.brand,
      marginTop: 8,
      textDecorationLine: 'underline',
    },
  })

export default getStyles
