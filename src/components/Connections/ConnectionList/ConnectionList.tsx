import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { View, FlatList } from 'react-native'

import Connection from './Connection'
import { Props } from './ConnectionListProps'
import getStyles from './styles'

import Text from '@src/components/common/Text'
import { useTheme } from '@src/hooks/providers/ThemeProvider'

const ConnectionList = ({
  onPress,
  onPressRightSide,
  connectionsBySections,
  isSearchingMode,
  selectedConnections,
}: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <FlatList
      style={styles.container}
      showsVerticalScrollIndicator={false}
      data={connectionsBySections}
      renderItem={({ item: section, index: sectionIndex }) => (
        <View key={section.title + sectionIndex}>
          <Text style={styles.sectionHeaderLabel} fontFamily="EuclidCircularA-Medium">
            {section.title}
          </Text>
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
                isSelected={Boolean(selectedConnections?.includes(connection.id))}
                isLastInSection={index === section.connections.length - 1}
              />
            )}
            keyExtractor={item => item.id}
          />
        </View>
      )}
      ListEmptyComponent={<Text style={styles.textEmpty}>{t('connection.noConnectionsFound')}</Text>}
      keyExtractor={item => item.title}
    />
  )
}

export default memo(ConnectionList)
