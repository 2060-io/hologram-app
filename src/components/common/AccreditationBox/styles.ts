import { StyleSheet } from 'react-native'
import { veranaCardColors } from '../ProofOfTrustCard/styles'

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 14,
    padding: 10,
  },
  title: {
    color: veranaCardColors.sub,
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 4,
  },
  schema: {
    color: veranaCardColors.ink,
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
    color: veranaCardColors.askText,
    flex: 1,
    fontSize: 12,
  },
  retry: {
    color: veranaCardColors.brand,
    marginTop: 8,
    textDecorationLine: 'underline',
  },
})

export default styles
