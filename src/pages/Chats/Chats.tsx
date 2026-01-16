import { StackActions } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View, TouchableOpacity, FlatList } from 'react-native'
import { uses24HourClock } from 'react-native-localize'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SwipeRow } from 'react-native-swipe-list-view'

import getStyles from './styles'

import {
  ChatThread,
  SearchInput,
  ChatSwipeOptions,
  ModalBottomHalf,
  ConfirmChatDeletion,
  ChatFilterOptions,
} from '@2060/components'
import { Text, SvgIcon, HeaderTitle } from '@2060/components/common'
import { ChatCategory, useChats, useMobileAgent } from '@2060/hooks/agent'
import { deleteConnection } from '@2060/hooks/agent/connections'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { ChatThreadData } from '@2060/model'
import { ChatsStackParams } from '@2060/navigators/ChatStackParams'
import { widthPercentageToDP } from '@2060/utils/responsiveUtils'

interface Props extends StackScreenProps<ChatsStackParams, 'ChatsMain'> {}

const Chats = ({ navigation }: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { agent } = useMobileAgent()
  const using24HourFormat = uses24HourClock()
  /* eslint-disable object-curly-newline */
  const { loading, deleteThread, archiveThreads, unarchiveThreads, filters, setFilters, threads } = useChats()
  const [showConfirmChatDeletion, setShowConfirmChatDeletion] = useState(false)
  const [showFilterOptions, setShowFilterOptions] = useState(false)
  const [showSearchInput, setShowSearchInput] = useState(false)
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([])
  const swipeRowReferences = useRef<SwipeRow<unknown>[]>([])
  const [chatThreadToDelete, setChatThreadToDelete] = useState<{ id: string; connectionId: string } | null>(
    null,
  )
  const isCategoryAll = filters.category === 'all'
  const isCategoryArchived = isCategoryAll && filters.archived
  const selectedCategory = isCategoryArchived ? 'archived' : filters.category

  const unreadThreadsCount = (total: number, { unreadCount }: ChatThreadData) => {
    return unreadCount ? total + unreadCount : total
  }

  const goToChat = (chatThreadId: string) => {
    navigation.dispatch(
      StackActions.push('PersonalChatStack', { screen: 'PersonalChat', params: { chatThreadId } }),
    )
  }

  const goToSubChats = (chatThreadId: string) => {
    navigation.navigate('SubChats', { chatThreadId })
  }

  const closeFilterOptions = () => {
    setShowFilterOptions(false)
  }

  const onChangeFilterOption = (option: string) => {
    const archived = option === 'archived'
    const category = (option === 'archived' ? 'all' : option) as ChatCategory
    setFilters({ category, archived })
    closeFilterOptions()
  }

  const onDeleteChat = (chatId: string, connectionId: string) => {
    setShowConfirmChatDeletion(true)
    setChatThreadToDelete({ id: chatId, connectionId })
  }

  const onChangeSearch = (value: string) => {
    const searchString = value.length >= 3 ? value : ''
    setFilters({ topic: searchString })
  }

  const isMainChatIncluded = (chat: ChatThreadData) => {
    const categoryMatches = isCategoryAll || (filters.category === 'services' && chat.isService)
    const archivedMatches = filters.archived === chat.archived
    return categoryMatches && archivedMatches && chat.active
  }

  const closeConfirmChatDeletion = () => {
    if (chatThreadToDelete?.id) swipeRowReferences.current[Number(chatThreadToDelete.id)].closeRow()
    setShowConfirmChatDeletion(false)
  }

  const deleteChat = () => {
    closeConfirmChatDeletion()
    if (chatThreadToDelete?.id) deleteThread(chatThreadToDelete.id)
  }

  const deleteChatAndConnection = async () => {
    closeConfirmChatDeletion()
    if (chatThreadToDelete?.id) deleteThread(chatThreadToDelete.id)
    const connection = chatThreadToDelete?.connectionId
      ? await agent?.connections.getById(chatThreadToDelete.connectionId)
      : null
    if (agent && connection) await deleteConnection(agent, connection)
  }

  useEffect(() => {
    const renderSearchInput = () => (
      <SearchInput
        containerStyle={styles.searchInputContainer}
        value={filters.topic}
        placeholder={t('chat.searchInputPlaceHolder')}
        onDebounced={onChangeSearch}
        renderLeftIcon={() => (
          <TouchableOpacity onPress={() => setShowSearchInput(false)}>
            <SvgIcon name="arrowLeft" width={18} height={18} fill={theme.colors.secondaryText} />
          </TouchableOpacity>
        )}
        textInputProps={{ autoFocus: true }}
      />
    )
    const renderHeaderTitle = () => (
      <HeaderTitle
        title={
          t('chat.chats') +
          ` ${isCategoryAll && !filters.archived ? '' : '- ' + t(`chat.${selectedCategory}`)}`
        }
        theme={theme}
      />
    )
    navigation.setOptions({
      headerTitle: showSearchInput ? renderSearchInput : renderHeaderTitle,
      headerLeft: () =>
        !showSearchInput && (
          <TouchableOpacity style={styles.btnIconContextMenu} onPress={() => setShowFilterOptions(true)}>
            <SvgIcon name="filterOutline" fill={theme.colors.primaryText} />
          </TouchableOpacity>
        ),
      headerRight: () =>
        !showSearchInput && (
          <View style={styles.containerHeaderRight}>
            <TouchableOpacity onPress={() => setShowSearchInput(true)}>
              <SvgIcon name="search" fill={theme.colors.primaryText} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rightHeaderButton}
              onPress={() => navigation.dispatch(StackActions.push('ConnectionsForNewChat'))}
            >
              <SvgIcon name="addCircle" fill={theme.colors.primaryText} />
            </TouchableOpacity>
          </View>
        ),
    })
  }, [filters.category, filters.archived, theme.colors, showSearchInput])

  return (
    <>
      <SafeAreaView style={styles.root} edges={['left', 'right']}>
        <FlatList
          showsVerticalScrollIndicator={false}
          data={threads}
          extraData={[selectedChatIds, theme.isDarkMode]}
          renderItem={({ item: chat }) => {
            const hasSubConnections = !!chat.subthreads.length
            if (hasSubConnections) {
              return (
                <ChatThread
                  {...chat}
                  childCount={(isMainChatIncluded(chat) ? 1 : 0) + chat.subthreads.length}
                  unreadCount={chat.subthreads.reduce(
                    unreadThreadsCount,
                    isMainChatIncluded(chat) ? chat.unreadCount : 0,
                  )}
                  using24HourFormat={using24HourFormat}
                  onPressChatThread={() => goToSubChats(chat.id)}
                />
              )
            }
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
                  onDeleteChat={() => onDeleteChat(chat.id, chat.connectionId)}
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
          keyExtractor={item => item.id}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.containerListEmpty}>
                <Text style={styles.textListEmpty}>{t('chat.emptyListDescription')}</Text>
              </View>
            ) : null
          }
        />
        <ConfirmChatDeletion
          visible={showConfirmChatDeletion}
          onClose={closeConfirmChatDeletion}
          onCancel={closeConfirmChatDeletion}
          onDeleteChat={deleteChat}
          onConfirmSecondary={deleteChatAndConnection}
        />
        <ModalBottomHalf visible={showFilterOptions} onClose={closeFilterOptions}>
          <ChatFilterOptions onChangeOption={onChangeFilterOption} selectedOption={selectedCategory} />
        </ModalBottomHalf>
      </SafeAreaView>
    </>
  )
}

export default Chats
