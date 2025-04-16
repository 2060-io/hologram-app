import React from 'react'
import { View, TouchableOpacity } from 'react-native'

import SvgIcon, { IconsNames } from '../SvgIcon'

import { ConnectionMainActionsProps, ActionIconsNames } from './Props'

import { useConnectionMainActions } from '@2060/hooks/useConnectionMainActions'
import { withConnectionMainActions } from '@2060/pages/ConnectionDetails/withConnectionMainActions'

const ConnectionMainActions = ({
  defaultActions = [],
  connection,
  iconColor,
}: ConnectionMainActionsProps) => {
  const { actions } = useConnectionMainActions({ defaultActions, connection })
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

export default withConnectionMainActions(ConnectionMainActions)
