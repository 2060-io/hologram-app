import React from 'react'
import { View, TouchableOpacity } from 'react-native'

import SvgIcon, { IconsNames } from '../SvgIcon'

import { ChannelIconsProps, ChannelIconsNames } from './ChannelIconProps'

import { useConnectionChannels } from '@2060/hooks/useConnectionChannels'
import { withConnectionMainActions } from '@2060/pages/ConnectionDetails/withConnectionMainActions'

const ChannelIcons = ({ defaultChannels = [], connection, iconColor }: ChannelIconsProps) => {
  const { channels } = useConnectionChannels({ defaultChannels, connection })
  return (
    <View style={{ flexDirection: 'row' }}>
      {channels?.map((channel, index) => (
        <TouchableOpacity
          key={channel.value}
          onPress={channel.onPress}
          activeOpacity={0.6}
          style={{ marginRight: index === channels.length - 1 ? 0 : 12 }}
        >
          <SvgIcon
            name={ChannelIconsNames[channel.value] as keyof IconsNames}
            fill={iconColor}
            width={20}
            height={20}
          />
        </TouchableOpacity>
      ))}
    </View>
  )
}

export default withConnectionMainActions(ChannelIcons)
