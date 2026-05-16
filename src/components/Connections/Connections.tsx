import { HeaderBackButton } from '@react-navigation/elements'
import { ParamListBase } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { Avatar, HeaderTitle, SvgIcon, Text } from '@src/components/common'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { getGlobalStyles } from '@src/styles'
import React, { memo, ReactElement, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import SearchInput from '../SearchInput'
import ConnectionList, { ConnectionItem } from './ConnectionList'
import getStyles from './styles'
import { useConnectionsBySections } from './useConnectionsBySections'

type HeaderProps = {
  presentation?: 'card' | 'modal' | 'transparentModal'
  height: number
  title: string
  titleForSubConnections?: string
  defaultBackButton?: ReactElement
}

type Props = {
  navigation: StackNavigationProp<ParamListBase>
  onPressConnection: (connectionItem: ConnectionItem) => void
  headerProps: HeaderProps
  selectedConnections?: string[]
  excludedConnections?: string[]
}

const Connections = ({
  navigation,
  onPressConnection,
  headerProps,
  excludedConnections = [],
  selectedConnections,
}: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const globalStyles = getGlobalStyles(theme)
  const {
    search,
    setSearch,
    showSearchInput,
    setShowSearchInput,
    connectionsBySections,
    isSearchingMode,
    currentConnectionToFilter,
    setCurrentConnectionToFilter,
    subConnectionsBySections,
    displaySubConnectionsOfConnection,
  } = useConnectionsBySections({ excludedConnections })

  const renderHeaderTitleForSubConnections = () => (
    <View style={styles.headerWithSubConnectionsContainer}>
      <Avatar
        uri={currentConnectionToFilter?.avatarUrl}
        label={currentConnectionToFilter?.name}
        size="8.41%"
        bgAvatarInitials={theme.colors.secondary}
      />
      <View style={styles.headerWithSubConnectionsTitleContainer}>
        <HeaderTitle
          title={headerProps.titleForSubConnections ?? currentConnectionToFilter?.name ?? ''}
          theme={theme}
        />
      </View>
    </View>
  )

  const renderHeaderTitle = () => <HeaderTitle title={headerProps.title} theme={theme} />

  useEffect(() => {
    navigation.setOptions({
      headerStyle: { ...globalStyles.headerStyle, height: headerProps.height },
      presentation: headerProps.presentation,
      headerLeft: (props) =>
        headerProps.defaultBackButton && !currentConnectionToFilter ? (
          headerProps.defaultBackButton
        ) : (
          <HeaderBackButton
            {...props}
            onPress={() => (currentConnectionToFilter ? setCurrentConnectionToFilter(undefined) : props.onPress?.())}
          />
        ),
      headerTitle: currentConnectionToFilter ? renderHeaderTitleForSubConnections : renderHeaderTitle,
      headerTitleAlign: currentConnectionToFilter ? 'left' : 'center',
      headerRight: () => (
        <TouchableOpacity style={styles.headerRight} onPress={() => setShowSearchInput((prev) => !prev)}>
          <SvgIcon name="search" fill={theme.colors.primaryText} />
        </TouchableOpacity>
      ),
    })
  }, [showSearchInput, theme.colors, currentConnectionToFilter])

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {showSearchInput && (
        <SearchInput
          containerStyle={styles.searchInputContainer}
          value={search}
          onDebounced={setSearch}
          renderLeftIcon={() => <SvgIcon name="search" fill={theme.colors.secondaryText} />}
          textInputProps={{ autoFocus: true }}
        />
      )}
      <View style={currentConnectionToFilter ? styles.hideConnectionsList : styles.displayConnectionsList}>
        <ConnectionList
          onPressRightSide={displaySubConnectionsOfConnection}
          onPress={onPressConnection}
          connectionsBySections={connectionsBySections}
          isSearchingMode={isSearchingMode}
          selectedConnections={selectedConnections}
        />
      </View>
      <View style={currentConnectionToFilter ? styles.displayConnectionsList : styles.hideConnectionsList}>
        <Text style={styles.connectionsRelatedText}>
          {`${t('connection.connectionsManagedBy')} ${currentConnectionToFilter?.name}`}
        </Text>
        <ConnectionList
          onPressRightSide={onPressConnection}
          onPress={onPressConnection}
          connectionsBySections={subConnectionsBySections}
          isSearchingMode={isSearchingMode}
          selectedConnections={selectedConnections}
        />
      </View>
    </SafeAreaView>
  )
}

export default memo(Connections)
