import React from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity, View } from 'react-native'

import { withRenderConnectionMainActions } from '../../ConnectionDetails/withRenderConnectionMainActions'

import getStyles from './styles'

import { SvgIcon, Text } from '@2060/components/common'
import {
  ConnectionMainActionsProps,
  ActionIconsNames,
} from '@2060/components/common/ConnectionMainActions/Props'
import { IconsNames } from '@2060/components/common/SvgIcon'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { useConnectionMainActions } from '@2060/hooks/useConnectionMainActions'
import { getConnectionDisplayName } from '@2060/utils/connectionUtils'

const AlreadyConnected = ({ navigation, connection, includeDefaultActions }: ConnectionMainActionsProps) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const iconColor = theme.colors.primaryText
  const { actions } = useConnectionMainActions({ navigation, connection, includeDefaultActions })
  const actionLabel: Record<keyof typeof ActionIconsNames, string> = {
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
        {actions.map(action => (
          <TouchableOpacity key={action.value} onPress={action.onPress} style={styles.actionContainer}>
            <SvgIcon name={ActionIconsNames[action.value] as keyof IconsNames} fill={iconColor} />
            <Text typography="EuclidCircularA-Regular" style={styles.actionText}>
              {actionLabel[action.value]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

export default withRenderConnectionMainActions(AlreadyConnected)
