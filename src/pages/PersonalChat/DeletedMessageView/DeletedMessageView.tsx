import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import getStyles from './styles'

import { Text } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'

type Props = {
  displayTimeAndTicks: boolean
  messageTime: string
}

const DeletedMessageView = memo(({ displayTimeAndTicks, messageTime }: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <View style={styles.container}>
      <Text style={styles.deletedText} typography="EuclidCircularA-Italic">
        {t('personalChat.messageDeleted')}
      </Text>
      {displayTimeAndTicks && (
        <View style={styles.subContainerAckAndTime}>
          <Text typography="EuclidCircularA-Regular" style={styles.timeText}>
            {messageTime}
          </Text>
        </View>
      )}
    </View>
  )
})

export default DeletedMessageView
