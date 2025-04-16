import React from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity, View } from 'react-native'

import { withConnectionMainActions } from '../withConnectionMainActions'

import getStyles from './styles'

import { SvgIcon, Text } from '@2060/components/common'
import { ChannelIconsProps, ChannelIconsNames } from '@2060/components/common/ChannelIcons/ChannelIconProps'
import { IconsNames } from '@2060/components/common/SvgIcon'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { useConnectionChannels } from '@2060/hooks/useConnectionChannels'
import { getConnectionDisplayName } from '@2060/utils/connectionUtils'

const AlreadyConnected = ({ defaultChannels, connection, iconColor }: ChannelIconsProps) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { channels } = useConnectionChannels({ defaultChannels, connection })
  const channelText: Record<keyof typeof ChannelIconsNames, string> = {
    audio: t('connection.call'),
    text: t('connection.goToChat'),
    video: t('connection.videoCall'),
  }
  const connectionName = getConnectionDisplayName(connection)

  return (
    <View style={styles.alreadyConnectedContainer}>
      <Text typography="EuclidCircularA-Medium" style={styles.alreadyConnectedText}>
        {t('connection.youAreAlreadyConnected', { connectionName })}
      </Text>
      <View style={styles.actionsContainer}>
        {channels.map(channel => (
          <TouchableOpacity key={channel.value} onPress={channel.onPress} style={styles.actionContainer}>
            <SvgIcon name={ChannelIconsNames[channel.value] as keyof IconsNames} fill={iconColor} />
            <Text typography="EuclidCircularA-Regular" style={styles.actionText}>
              {channelText[channel.value]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

export default withConnectionMainActions(AlreadyConnected)
