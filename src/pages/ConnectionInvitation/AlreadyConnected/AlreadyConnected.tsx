import { SvgIcon, Text } from '@src/components/common'
import { ActionIconsNames, ConnectionMainActionsProps } from '@src/components/common/ConnectionMainActions/Props'
import { IconsNames } from '@src/components/common/SvgIcon'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { useConnectionMainActions } from '@src/hooks/useConnectionMainActions'
import { getConnectionDisplayName } from '@src/utils/connectionUtils'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity, View } from 'react-native'
import { withRenderConnectionMainActions } from '../../ConnectionDetails/withRenderConnectionMainActions'
import getStyles from './styles'

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
      <Text fontFamily="EuclidCircularA-Medium" style={styles.alreadyConnectedText}>
        {t('connection.youAreAlreadyConnected', { connectionName })}
      </Text>
      <View style={styles.actionsContainer}>
        {actions.map((action) => (
          <TouchableOpacity key={action.value} onPress={action.onPress} style={styles.actionContainer}>
            <SvgIcon name={ActionIconsNames[action.value] as keyof IconsNames} fill={iconColor} />
            <Text style={styles.actionText}>{actionLabel[action.value]}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

export default withRenderConnectionMainActions(AlreadyConnected)
