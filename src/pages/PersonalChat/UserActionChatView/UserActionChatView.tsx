import React from 'react'
import { View } from 'react-native'

import { Header } from '../components'

import getStyles from './styles'

import { Text } from '@2060/components/common'
import { IconsNames } from '@2060/components/common/SvgIcon'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { ChatEntryRole } from '@2060/model'

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
      <Text typography="EuclidCircularA-Regular" style={styles.responseMsg}>
        {message}
      </Text>
    </View>
  )
}

export default UserActionChatView
