import React, { memo } from 'react'
import { TouchableOpacity, View, Image } from 'react-native'

import { ContextualMenuProps } from './ContextualMenuProps'
import getStyles from './styles'

import { Text } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'

const ContextualMenu = ({ onSelectOption, connectionIconUrl, menu }: ContextualMenuProps) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <View style={styles.containerActionsMenu}>
      <View style={styles.containerMenuHeader}>
        {connectionIconUrl && (
          <Image source={{ uri: connectionIconUrl }} resizeMethod="resize" style={styles.image} />
        )}
        <View style={styles.containerActionHeader}>
          {menu.title && (
            <Text typography="EuclidCircularA-Medium" style={styles.actionTitle}>
              {menu.title}
            </Text>
          )}
          {menu.description && (
            <Text typography="EuclidCircularA-Regular" style={styles.actionDescription}>
              {menu.description}
            </Text>
          )}
        </View>
      </View>
      {menu.options.map(({ name, title }) => (
        <View key={name} style={styles.containerOptionCard}>
          <TouchableOpacity key={name} style={styles.containerAction} onPress={() => onSelectOption(name)}>
            <Text typography="EuclidCircularA-Regular" style={styles.actionText}>
              {title}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  )
}

export default memo(ContextualMenu)
