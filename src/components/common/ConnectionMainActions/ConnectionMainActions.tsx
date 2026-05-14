import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { useConnectionMainActions } from '@src/hooks/useConnectionMainActions'
import { withRenderConnectionMainActions } from '@src/pages/ConnectionDetails/withRenderConnectionMainActions'
import React from 'react'
import { TouchableOpacity, View } from 'react-native'
import SvgIcon, { IconsNames } from '../SvgIcon'
import { ActionIconsNames, ConnectionMainActionsProps } from './Props'
import styles from './styles'

const ConnectionMainActions = ({ navigation, connection, includeDefaultActions }: ConnectionMainActionsProps) => {
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
