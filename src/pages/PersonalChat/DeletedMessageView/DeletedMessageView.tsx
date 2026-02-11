import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import getStyles from './styles'

import { Text } from '@src/components/common'
import { useTheme } from '@src/hooks/providers/ThemeProvider'

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
      <Text style={styles.deletedText} fontFamily="EuclidCircularA-Italic">
        {t('personalChat.messageDeleted')}
      </Text>
      {displayTimeAndTicks && (
        <View style={styles.subContainerAckAndTime}>
          <Text style={styles.timeText}>{messageTime}</Text>
        </View>
      )}
    </View>
  )
})

export default DeletedMessageView
