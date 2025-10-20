import { HeaderBackButton } from '@react-navigation/elements'
import { ParamListBase } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import React, { ReactElement, useEffect, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, TouchableOpacity, View } from 'react-native'

import getStyles from './styles'
import { useConnections } from './useConnections'

import { ConnectionList, SearchInput } from '@2060/components'
import { ConnectionItem } from '@2060/components/ConnectionsList/ConnectionListProps'
import { Avatar, HeaderTitle, SvgIcon, Text } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { getGlobalStyles } from '@2060/styles'

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
  allowSelection?: boolean
  selectedConnections?: string[]
  excludedConnections?: string[]
}

const BaseConnections = ({
  navigation,
  onPressConnection,
  headerProps,
  allowSelection = false,
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
    connectionListForDisplay,
    isSearchingMode,
    currentConnectionToFilter,
    setCurrentConnectionToFilter,
    subConnections,
    displaySubConnectionsOfConnection,
  } = useConnections({ excludedConnections })

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
      headerLeft: props =>
        headerProps.defaultBackButton && !currentConnectionToFilter ? (
          headerProps.defaultBackButton
        ) : (
          <HeaderBackButton
            {...props}
            onPress={() =>
              currentConnectionToFilter ? setCurrentConnectionToFilter(undefined) : props.onPress?.()
            }
          />
        ),
      headerTitle: currentConnectionToFilter ? renderHeaderTitleForSubConnections : renderHeaderTitle,
      headerTitleAlign: currentConnectionToFilter ? 'left' : 'center',
      headerRight: () => (
        <TouchableOpacity style={styles.headerRight} onPress={() => setShowSearchInput(prev => !prev)}>
          <SvgIcon name="search" fill={theme.colors.primaryText} />
        </TouchableOpacity>
      ),
    })
  }, [showSearchInput, theme.colors, currentConnectionToFilter])

  return (
    <SafeAreaView style={styles.container}>
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
          connectionList={connectionListForDisplay}
          isSearchingMode={isSearchingMode}
          allowSelection={allowSelection}
          selectedConnections={selectedConnections}
        />
      </View>
      <View style={currentConnectionToFilter ? styles.displayConnectionsList : styles.hideConnectionsList}>
        <Text style={styles.connectionsRelatedText} typography="EuclidCircularA-Regular">
          {`${t('connection.connectionsManagedBy')} ${currentConnectionToFilter?.name}`}
        </Text>
        <ConnectionList
          onPressRightSide={onPressConnection}
          onPress={onPressConnection}
          connectionList={subConnections}
          isSearchingMode={isSearchingMode}
          allowSelection={allowSelection}
          selectedConnections={selectedConnections}
        />
      </View>
    </SafeAreaView>
  )
}

export default memo(BaseConnections)
