import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { View, TouchableOpacity } from 'react-native'

import getStyles from './styles'

import { Text, SvgIcon } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'

interface Props {
  isArchived: boolean
  onArchiveChat(): void
  onDeleteChat(): void
  isSwiped: boolean
}

export const ChatSwipeOptions: React.FC<Props> = ({ isArchived, onDeleteChat, onArchiveChat, isSwiped }) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const archiveBackgroundColor = isArchived ? styles.unarchiveBackground : styles.archiveBackground
  const display = isSwiped ? 'flex' : 'none'
  return (
    <View style={[styles.container, { display }]}>
      <TouchableOpacity
        style={[styles.button, styles.deleteBackground]}
        onPress={onDeleteChat}
        activeOpacity={0.7}
      >
        <SvgIcon name="trashOutlined" fill={theme.colors.white} width={20} height={20} />
        <Text fontFamily="EuclidCircularA-Medium" style={styles.backText}>
          {t('chat.delete')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, { ...archiveBackgroundColor }]}
        onPress={onArchiveChat}
        activeOpacity={0.7}
      >
        <SvgIcon name="archive" fill={theme.colors.white} width={20} height={20} />
        <Text fontFamily="EuclidCircularA-Medium" style={styles.backText}>
          {t(`chat.${isArchived ? 'unarchive' : 'archive'}`)}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

export default memo(ChatSwipeOptions)
