import { useTheme } from '@src/hooks/providers/ThemeProvider'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { SvgIcon, Switch, Text } from '../common'
import { IconsNames } from '../common/SvgIcon'
import { Channels, CommunicationChannelsProps } from './CommunicationChannelsProps'
import getStyles from './styles'

const channelIcons: Record<keyof Channels, string> = {
  allowChats: 'chat',
  allowAudioCalls: 'phone',
  allowVideoCalls: 'video',
}

const CommunicationChannels = ({ channels, setChannels, containerChannelsStyle }: CommunicationChannelsProps) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { t } = useTranslation()

  const onToggleCommunicationChannels = (value: boolean, key: string) => {
    setChannels((prevState) => ({ ...prevState, [key]: !value }))
  }

  const renderChannel = (channel: keyof Channels) => {
    const isChecked = channels[channel]
    const iconAndTextColor = isChecked ? theme.colors.tertiaryText : theme.colors.secondaryGrey
    return (
      <View style={styles.containerChannel} key={channel}>
        <SvgIcon name={channelIcons[channel] as keyof IconsNames} fill={iconAndTextColor} />
        <Text style={[styles.channelText, { color: iconAndTextColor }]}>{t(`settings.${channel}`)}</Text>
        <Switch isChecked={isChecked} onToggle={() => onToggleCommunicationChannels(isChecked, channel)} />
      </View>
    )
  }

  return (
    <View style={containerChannelsStyle}>
      {Object.keys(channels).map((channel) => renderChannel(channel as keyof Channels))}
    </View>
  )
}

export default CommunicationChannels
