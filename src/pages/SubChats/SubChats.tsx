import { StackActions } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View, Image, TouchableOpacity } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { uses24HourClock } from 'react-native-localize'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SwipeRow } from 'react-native-swipe-list-view'

import getStyles from './styles'

import {
  SearchInput,
  ChatSwipeOptions,
  ChatThread,
  ModalBottomHalf,
  ConfirmChatDeletion,
  ChatFilterOptions,
} from '@2060/components'
import { Text, SvgIcon, HeaderTitle } from '@2060/components/common'
import { useChatThreadById, useChatThreadsbyParentId, useChats } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { ChatThreadData } from '@2060/model'
import { ChatsStackParams } from '@2060/navigators/ChatStackParams'
import { widthPercentageToDP } from '@2060/utils/responsiveUtils'

type contextMenuTypes = 'confirm-deletion' | 'filter-options'
type SubChatCategory = 'all' | 'archived'
interface Props extends StackScreenProps<ChatsStackParams, 'SubChats'> {}

const SubChats: React.FC<Props> = ({ route, navigation }) => {
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [showSearchInput, setShowSearchInput] = useState(false)
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([])
  const [chatIdToDelete, setChatIdToDelete] = useState<string>('')
  const { deleteThread, archiveThreads, unarchiveThreads, filters, setFilters } = useChats()
  const isCategoryArchived = filters.category === 'all' && filters.archived
  const [category, setCategory] = useState<SubChatCategory>(isCategoryArchived ? 'archived' : 'all')
  const parentChatThread = useChatThreadById(route.params.chatThreadId)
  const chatThreads = useChatThreadsbyParentId(route.params.chatThreadId, category, filters.topic)
  const { t } = useTranslation()
  const using24HourFormat = uses24HourClock()
  const swipeRowReferences = useRef<SwipeRow<unknown>[]>([])
  const contextMenutypeRef = useRef<contextMenuTypes>('filter-options')
  const theme = useTheme()
  const styles = getStyles(theme)
  const goToChat = (chatThreadId: string) => {
    navigation.dispatch(
      StackActions.push('PersonalChatStack', { screen: 'PersonalChat', params: { chatThreadId } }),
    )
  }

  const getChatThreads = (subChats: ChatThreadData[]) => {
    // If parent chat thread was marked for delete, don't show it
    if (!parentChatThread?.active) return subChats

    const isParenthreadArchived = parentChatThread && parentChatThread.archived

    if (isParenthreadArchived && category === 'archived') return [parentChatThread, ...subChats]
    if (!isParenthreadArchived && category === 'all') return [parentChatThread, ...subChats]

    return subChats
  }

  const subChatsList = getChatThreads(chatThreads)

  const handleClosingContextMenu = () => {
    contextMenutypeRef.current = 'filter-options'
    setShowContextMenu(false)
  }

  const handleChangeSearch = (value: string) => {
    const searchString = value.length >= 3 ? value : ''
    setFilters({ topic: searchString })
  }

  const handleDeleteChat = (chatId: string) => {
    handleOpeningContextMenu('confirm-deletion')
    setChatIdToDelete(chatId)
  }

  const handleOpeningContextMenu = (contextMenuType: contextMenuTypes) => {
    contextMenutypeRef.current = contextMenuType
    setShowContextMenu(true)
  }

  const handleChangeFilterOption = (categoryOption: SubChatCategory) => {
    setCategory(categoryOption)
    if (isCategoryArchived && categoryOption === 'all') setFilters({ category: 'all', archived: false })
    handleClosingContextMenu()
  }

  const renderHeaderTitle = () => (
    <View style={styles.containerHeaderTitle}>
      {parentChatThread?.picture && (
        <View style={styles.containerImage}>
          <Image source={{ uri: parentChatThread.picture }} style={styles.avatarHeader} />
        </View>
      )}
      <HeaderTitle title={parentChatThread?.topic ?? ''} theme={theme} />
    </View>
  )

  const renderSearchInput = () => (
    <SearchInput
      containerStyle={styles.searchInputContainer}
      value={filters.topic}
      placeholder={t('chat.searchInputPlaceHolder')}
      onDebounced={handleChangeSearch}
      renderLeftIcon={() => (
        <TouchableOpacity onPress={() => setShowSearchInput(false)}>
          <SvgIcon name="arrowLeft" width={18} height={18} fill={theme.colors.secondaryText} />
        </TouchableOpacity>
      )}
      textInputProps={{ autoFocus: true }}
    />
  )

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: showSearchInput ? renderSearchInput : renderHeaderTitle,
      headerTitleAlign: 'left',
      headerLeft: () =>
        !showSearchInput && (
          <TouchableOpacity
            style={styles.btnIconContextMenu}
            onPress={() => handleOpeningContextMenu('filter-options')}
          >
            <SvgIcon name="filterOutline" fill={theme.colors.primaryText} />
          </TouchableOpacity>
        ),
      headerRight: () =>
        !showSearchInput && (
          <TouchableOpacity style={styles.rightHeaderButton} onPress={() => setShowSearchInput(true)}>
            <SvgIcon name="search" fill={theme.colors.primaryText} />
          </TouchableOpacity>
        ),
    })
  }, [parentChatThread, theme.colors, showSearchInput])

  return (
    <SafeAreaView style={styles.root} edges={['left', 'right']}>
      <View style={styles.root}>
        <FlatList
          showsVerticalScrollIndicator={false}
          data={subChatsList}
          extraData={[selectedChatIds, theme.isDarkMode]}
          keyExtractor={item => item.id}
          renderItem={({ item: chat }) => {
            const isSwiped = selectedChatIds.includes(chat.id)
            return (
              <SwipeRow
                ref={ref => {
                  if (ref) swipeRowReferences.current[Number(chat.id)] = ref
                }}
                key={chat.id}
                disableRightSwipe
                rightOpenValue={-widthPercentageToDP('36.20%')}
                swipeGestureBegan={() => setSelectedChatIds(prev => [...prev, chat.id])}
                onRowClose={() => setSelectedChatIds(prev => prev.filter(id => id !== chat.id))}
                disableHiddenLayoutCalculation
              >
                <ChatSwipeOptions
                  isSwiped={isSwiped}
                  isArchived={chat.archived}
                  onDeleteChat={() => handleDeleteChat(chat.id)}
                  onArchiveChat={() => {
                    swipeRowReferences.current[Number(chat.id)].closeRow()
                    chat.archived ? unarchiveThreads([chat.id]) : archiveThreads([chat.id])
                  }}
                />
                <View style={isSwiped ? styles.bgSelectedChat : styles.bgContainerChat}>
                  <ChatThread
                    {...chat}
                    lastActivityAt={chat.lastActivityAt ?? chat.createdAt}
                    using24HourFormat={using24HourFormat}
                    onPressChatThread={() => goToChat(chat.id)}
                  />
                </View>
              </SwipeRow>
            )
          }}
          ListEmptyComponent={
            <View style={styles.containerListEmpty}>
              <Text style={styles.textListEmpty}>{t('chat.noChatsFound')}</Text>
            </View>
          }
        />
        {showContextMenu && contextMenutypeRef.current === 'confirm-deletion' && (
          <ConfirmChatDeletion
            onClose={handleClosingContextMenu}
            onCloseContextMenu={() => {
              swipeRowReferences.current[Number(chatIdToDelete)].closeRow()
              handleClosingContextMenu()
            }}
            onDeleteChat={() => {
              swipeRowReferences.current[Number(chatIdToDelete)].closeRow()
              deleteThread(chatIdToDelete)
              handleClosingContextMenu()
            }}
          />
        )}
        {showContextMenu && contextMenutypeRef.current === 'filter-options' && (
          <ModalBottomHalf visible={showContextMenu} onClose={handleClosingContextMenu}>
            <ChatFilterOptions
              options={[
                { id: '1', name: 'allChats', value: 'all' },
                { id: '2', name: 'archived', value: 'archived' },
              ]}
              selectedOption={category}
              onChangeOption={handleChangeFilterOption}
            />
          </ModalBottomHalf>
        )}
      </View>
    </SafeAreaView>
  )
}

export default SubChats
