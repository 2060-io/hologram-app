import { Text } from '@src/components/common'
import { IconsNames } from '@src/components/common/SvgIcon'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { ChatEntryRole } from '@src/model'
import React from 'react'
import { View } from 'react-native'
import { Header } from '../components'
import getStyles from './styles'

type Props = {
  message: string
  title: string
  iconName: keyof IconsNames
}

const UserActionChatView = ({ message, title, iconName }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <View style={styles.container}>
      <Header title={title} theme={theme} leftIconName={iconName} role={ChatEntryRole.Sender} />
      <Text style={styles.responseMsg}>{message}</Text>
    </View>
  )
}

export default UserActionChatView
