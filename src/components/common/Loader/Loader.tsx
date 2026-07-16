import { useTheme } from '@src/hooks/providers/ThemeProvider'
import React from 'react'
import { ActivityIndicator, View } from 'react-native'
import Text from '../Text'
import getStyles from './styles'

type LoaderProps = {
  message?: string
}

const Loader = ({ message }: LoaderProps) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  return (
    <View style={styles.container}>
      <Text style={styles.textMessageLoader}>{message}</Text>
      <ActivityIndicator size="large" color={theme.colors.green} />
    </View>
  )
}

export default Loader
