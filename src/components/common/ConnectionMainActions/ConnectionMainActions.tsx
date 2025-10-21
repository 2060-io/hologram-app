import React from 'react'
import { View, TouchableOpacity } from 'react-native'

import SvgIcon, { IconsNames } from '../SvgIcon'

import { ConnectionMainActionsProps, ActionIconsNames } from './Props'
import styles from './styles'

import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { useConnectionMainActions } from '@2060/hooks/useConnectionMainActions'
import { withRenderConnectionMainActions } from '@2060/pages/ConnectionDetails/withRenderConnectionMainActions'

const ConnectionMainActions = ({
  navigation,
  connection,
  includeDefaultActions,
}: ConnectionMainActionsProps) => {
  const theme = useTheme()
  const { actions } = useConnectionMainActions({ navigation, connection, includeDefaultActions })

  return (
    <View style={styles.container}>
      {actions.map((action, index) => (
        <TouchableOpacity
          key={action.value}
          onPress={action.onPress}
          activeOpacity={0.6}
          style={index === actions.length - 1 ? styles.lastItem : styles.item}
        >
          <SvgIcon
            name={ActionIconsNames[action.value] as keyof IconsNames}
            fill={theme.colors.primaryText}
            width={20}
            height={20}
          />
        </TouchableOpacity>
      ))}
    </View>
  )
}

export default withRenderConnectionMainActions(ConnectionMainActions)
