import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'
import { View, Text } from 'react-native'

import getStyles from './styles'
import { usePresentCredentialAsQR } from './usePresentCredentialAsQR'

import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'

interface Props extends StackScreenProps<NavigationStackParams, 'PresentCredentialAsQR'> {}

const PresentCredentialAsQR = ({ route }: Props) => {
  const { attributesToPresent } = route.params
  const theme = useTheme()
  const styles = getStyles(theme)
  usePresentCredentialAsQR({ attributesToPresent })

  return (
    <View style={styles.container}>
      <Text>PresentCredentialAsQR</Text>
    </View>
  )
}

export default PresentCredentialAsQR
