import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { View, FlatList } from 'react-native'

import Connection from './Connection'
import { Props } from './ConnectionListProps'
import getStyles from './styles'

import Text from '@2060/components/common/Text'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'

const ConnectionList = ({
  onPress,
  onPressRightSide,
  connectionList,
  isSearchingMode,
  allowSelection,
  selectedConnections,
}: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <FlatList
      style={styles.container}
      showsVerticalScrollIndicator={false}
      data={connectionList}
      renderItem={({ item: section, index: sectionIndex }) => (
        <View key={section.title + sectionIndex}>
          <Text style={styles.sectionHeaderLabel}>{section.title}</Text>
          <FlatList
            style={styles.containerSectionList}
            showsVerticalScrollIndicator={false}
            data={section.connections}
            renderItem={({ item: connection, index }) => (
              <Connection
                onPress={() => onPress(connection)}
                onPressRightSide={() => onPressRightSide(connection)}
                connection={connection}
                isSearchingMode={isSearchingMode}
                allowSelection={allowSelection}
                isSelected={Boolean(selectedConnections?.includes(connection.id))}
                isLastInSection={index === section.connections.length - 1}
              />
            )}
            keyExtractor={item => item.name}
          />
        </View>
      )}
      ListEmptyComponent={
        <Text style={styles.textEmpty} typography="EuclidCircularA-Regular">
          {t('connection.noConnectionsFound')}
        </Text>
      }
      keyExtractor={item => item.title}
    />
  )
}

export default memo(ConnectionList)
