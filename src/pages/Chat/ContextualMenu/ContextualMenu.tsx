import React, { memo } from 'react'
import { TouchableOpacity, View } from 'react-native'

import { ContextualMenuProps } from './ContextualMenuProps'
import getStyles from './styles'

import { Text, UniversalImage } from '@src/components/common'
import { useTheme } from '@src/hooks/providers/ThemeProvider'

const ContextualMenu = ({ onSelectOption, connectionIconUrl, menu }: ContextualMenuProps) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <View style={styles.containerActionsMenu}>
      <View style={styles.containerMenuHeader}>
        {connectionIconUrl && (
          <UniversalImage source={{ uri: connectionIconUrl }} resizeMethod="resize" style={styles.image} />
        )}
        <View style={styles.containerActionHeader}>
          {menu.title && (
            <Text fontFamily="EuclidCircularA-Medium" style={styles.actionTitle}>
              {menu.title}
            </Text>
          )}
          {menu.description && <Text style={styles.actionDescription}>{menu.description}</Text>}
        </View>
      </View>
      {menu.options.map(({ name, title }) => (
        <View key={name} style={styles.containerOptionCard}>
          <TouchableOpacity key={name} style={styles.containerAction} onPress={() => onSelectOption(name)}>
            <Text style={styles.actionText}>{title}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  )
}

export default memo(ContextualMenu)
