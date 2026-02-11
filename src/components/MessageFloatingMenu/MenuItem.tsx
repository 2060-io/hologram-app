import React from 'react'
import { TouchableOpacity, View } from 'react-native'

import getStyles from './styles'

import { Text, Icon } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { MessageAction } from '@2060/pages/Chat/ChatProps'

interface Props extends MessageAction {
  onActionSelected(actionId: string): void
  isNotLast: boolean
}

const MenuItem = ({ id, icon, asIcon = 'Ionicons', label, isNotLast, onActionSelected }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const iconColor: Record<string, string> = {
    'action-delete': theme.colors.red,
    'action-report': theme.colors.red,
  }

  const onPress = () => onActionSelected(id)

  return (
    <>
      <TouchableOpacity onPress={onPress} style={styles.optionContainer} activeOpacity={0.7}>
        <Text style={[styles.optionText, { color: iconColor[id] ?? theme.colors.blue }]}>{label}</Text>
        <Icon name={icon} as={asIcon} size={15} color={iconColor[id] ?? theme.colors.green} />
      </TouchableOpacity>
      {isNotLast && <View style={styles.separator} />}
    </>
  )
}

export default MenuItem
