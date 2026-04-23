import { DidCommConnectionRecord } from '@credo-ts/didcomm'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View, TouchableOpacity } from 'react-native'
import { AlphabetList, IData } from 'react-native-section-alphabet-list'

import getStyles from './styles'

import { SearchInput } from '@src/components'
import { NavigationStackParams } from '@src/components/Navigation/NavigationProps'
import { Avatar, SvgIcon, Text } from '@src/components/common'
import UniversalImage from '@src/components/common/UniversalImage'
import { useConnectionById, useConnectionByParentConnectionId } from '@src/hooks/agent'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { getConnectionDisplayName, getConnectionDisplayPicture } from '@src/utils/connectionUtils'

interface SubConnectionData extends IData {
  avatar: string
}

type Props = StackScreenProps<NavigationStackParams, 'RelatedConnections'>
const RelatedConnections: React.FC<Props> = ({ navigation, route }) => {
  const [showSearchInput, setShowSearchInput] = useState(false)
  const [search, setSearch] = useState('')
  const parentConnectionId = route.params.parentConnectionId as string
  const connectionParent = useConnectionById(parentConnectionId) as DidCommConnectionRecord
  const haveParentDisplayImage = getConnectionDisplayPicture(connectionParent)
  const parentConnectionName = getConnectionDisplayName(connectionParent)
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const subConnections = useConnectionByParentConnectionId(parentConnectionId)

  const subConnectionList = useMemo(
    () =>
      subConnections.map(
        subConnection =>
          ({
            key: subConnection.id,
            value: getConnectionDisplayName(subConnection),
            avatar: getConnectionDisplayPicture(subConnection),
          }) as SubConnectionData,
      ),
    [subConnections],
  )

  const onGoToBack = () => navigation.canGoBack() && navigation.goBack()

  const handleSelectedSubConnection = (subconnectionId: string) => {
    const connection = subConnections.find(record => record.id === subconnectionId)
    if (!connection) return

    navigation.navigate('ConnectionDetails', { connectionId: connection.id })
  }

  const headerTitle = () => (
    <View style={styles.containerHeaderTitle}>
      {haveParentDisplayImage && (
        <View style={styles.containerImage}>
          <UniversalImage source={{ uri: haveParentDisplayImage }} style={styles.avatarHeader} />
        </View>
      )}
      <Text style={styles.titleHeader} fontFamily="EuclidCircularA-Medium" numberOfLines={1}>
        {parentConnectionName}
      </Text>
    </View>
  )

  const handleChangeHeaderOptions = () => {
    navigation.setOptions({
      headerTitle,
      headerTitleAlign: 'left',
      headerRight: () => (
        <TouchableOpacity style={styles.rightHeaderButton} onPress={() => setShowSearchInput(prev => !prev)}>
          <SvgIcon name="search" fill={theme.colors.primaryText} />
        </TouchableOpacity>
      ),
    })
  }

  useEffect(handleChangeHeaderOptions, [])

  if (!parentConnectionId) onGoToBack()

  return (
    <View style={styles.container}>
      {showSearchInput && (
        <SearchInput
          containerStyle={styles.searchInputContainer}
          value={search}
          onDebounced={setSearch}
          renderLeftIcon={() => <SvgIcon name="search" fill={theme.colors.secondaryText} />}
          textInputProps={{ autoFocus: true }}
        />
      )}
      <Text style={styles.connectionRelatedToText}>
        {`${t('connection.connectionsManagedBy')} ${parentConnectionName}`}
      </Text>
      {/* <ConnectionList onPressConnection={goToConnectionDetails} connectionList={subConnectionList} /> */}
      <AlphabetList
        style={styles.listContainer}
        data={subConnectionList}
        indexLetterStyle={styles.letterStyle}
        renderCustomItem={item => (
          <TouchableOpacity
            style={[styles.containerConnectionItem]}
            onPress={() => handleSelectedSubConnection(item.key)}
          >
            <Avatar uri={(item as SubConnectionData).avatar} label={item.value} size="8.41%" />
            <Text fontFamily="EuclidCircularA-SemiBold" style={styles.listItemText}>
              {item.value}
            </Text>
          </TouchableOpacity>
        )}
        renderCustomSectionHeader={section => (
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionHeaderLabel} fontFamily="EuclidCircularA-Medium">
              {section.title}
            </Text>
          </View>
        )}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.containerEmptyList}>
            <Text fontFamily="EuclidCircularA-SemiBold" style={styles.textEmpty}>
              {t('connection.noConnectionsFound')}
            </Text>
          </View>
        )}
      />
    </View>
  )
}

export default RelatedConnections
