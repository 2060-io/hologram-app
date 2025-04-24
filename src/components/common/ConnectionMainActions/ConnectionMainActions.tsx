import React from 'react'
import { View, TouchableOpacity } from 'react-native'

import SvgIcon, { IconsNames } from '../SvgIcon'

import { ConnectionMainActionsProps, ActionIconsNames } from './Props'

import { useConnectionMainActions } from '@2060/hooks/useConnectionMainActions'
import { withRenderConnectionMainActions } from '@2060/pages/ConnectionDetails/withRenderConnectionMainActions'

const ConnectionMainActions = ({
  navigation,
  connection,
  iconColor,
  includeDefaultActions,
}: ConnectionMainActionsProps) => {
  const { actions } = useConnectionMainActions({ navigation, connection, includeDefaultActions })
  return (
    <View style={{ flexDirection: 'row' }}>
      {actions?.map((action, index) => (
        <TouchableOpacity
          key={action.value}
          onPress={action.onPress}
          activeOpacity={0.6}
          style={{ marginRight: index === actions.length - 1 ? 0 : 12 }}
        >
          <SvgIcon
            name={ActionIconsNames[action.value] as keyof IconsNames}
            fill={iconColor}
            width={20}
            height={20}
          />
        </TouchableOpacity>
      ))}
    </View>
  )
}

export default withRenderConnectionMainActions(ConnectionMainActions)
