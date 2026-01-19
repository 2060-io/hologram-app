import { StackActions } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View, Image, TouchableOpacity, FlatList } from 'react-native'
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
import {
  useAgentActionQueue,
  useChatThreadById,
  useChatThreadsbyParentId,
  useChats,
  useMobileAgent,
} from '@2060/hooks/agent'
import { deleteConnection } from '@2060/hooks/agent/connections'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { ChatThreadData } from '@2060/model'
import { ChatsStackParams } from '@2060/navigators/ChatStackParams'
import { widthPercentageToDP } from '@2060/utils/responsiveUtils'

type SubChatCategory = 'all' | 'archived'
interface Props extends StackScreenProps<ChatsStackParams, 'SubChats'> {}

const SubChats: React.FC<Props> = ({ route, navigation }) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { addAgentActionToQueue } = useAgentActionQueue()
  const { agent } = useMobileAgent()
  const [showConfirmChatDeletion, setShowConfirmChatDeletion] = useState(false)
  const [showFilterOptions, setShowFilterOptions] = useState(false)
  const [showSearchInput, setShowSearchInput] = useState(false)
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([])
  const [chatThreadToDelete, setChatThreadToDelete] = useState<{ id: string; connectionId: string } | null>(
    null,
  )
  const { deleteThread, archiveThreads, unarchiveThreads, filters, setFilters } = useChats()
  const isCategoryArchived = filters.category === 'all' && filters.archived
  const [category, setCategory] = useState<SubChatCategory>(isCategoryArchived ? 'archived' : 'all')
  const parentChatThread = useChatThreadById(route.params.chatThreadId)
  const chatThreads = useChatThreadsbyParentId(route.params.chatThreadId, category, filters.topic)
  const using24HourFormat = uses24HourClock()
  const swipeRowReferences = useRef<SwipeRow<unknown>[]>([])

  const goToChat = (chatThreadId: string) => {
    navigation.dispatch(
      StackActions.push('PersonalChatStack', { screen: 'PersonalChat', params: { chatThreadId } }),
    )
  }

  const getChatThreads = (subChats: ChatThreadData[]) => {
    // If parent chat thread was marked for delete, don't show it
    if (!parentChatThread?.active) return subChats

    const isParenThreadArchived = parentChatThread && parentChatThread.archived

    if (isParenThreadArchived && category === 'archived') return [parentChatThread, ...subChats]
    if (!isParenThreadArchived && category === 'all') return [parentChatThread, ...subChats]

    return subChats
  }

  const subChatsList = getChatThreads(chatThreads)

  const onDeleteChat = (chatId: string, connectionId: string) => {
    setShowConfirmChatDeletion(true)
    setChatThreadToDelete({ id: chatId, connectionId })
  }

  const onChangeSearch = (value: string) => {
    const searchString = value.length >= 3 ? value : ''
    setFilters({ topic: searchString })
  }

  const closeFilterOptions = () => {
    setShowFilterOptions(false)
  }

  const onChangeFilterOption = (categoryOption: SubChatCategory) => {
    setCategory(categoryOption)
    if (isCategoryArchived && categoryOption === 'all') setFilters({ category: 'all', archived: false })
    closeFilterOptions()
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
    if (agent && connection) await deleteConnection(agent, connection, addAgentActionToQueue)
  }

  useEffect(() => {
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
        onDebounced={onChangeSearch}
        renderLeftIcon={() => (
          <TouchableOpacity onPress={() => setShowSearchInput(false)}>
            <SvgIcon name="arrowLeft" width={18} height={18} fill={theme.colors.secondaryText} />
          </TouchableOpacity>
        )}
        textInputProps={{ autoFocus: true }}
      />
    )

    navigation.setOptions({
      headerTitle: showSearchInput ? renderSearchInput : renderHeaderTitle,
      headerTitleAlign: 'left',
      headerLeft: () =>
        !showSearchInput && (
          <TouchableOpacity style={styles.btnIconContextMenu} onPress={() => setShowFilterOptions(true)}>
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
    <>
      <SafeAreaView style={styles.root} edges={['left', 'right']}>
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
          ListEmptyComponent={
            <View style={styles.containerListEmpty}>
              <Text style={styles.textListEmpty}>{t('chat.noChatsFound')}</Text>
            </View>
          }
        />
      </SafeAreaView>
      <ConfirmChatDeletion
        visible={showConfirmChatDeletion}
        onClose={closeConfirmChatDeletion}
        onCancel={closeConfirmChatDeletion}
        onDeleteChat={deleteChat}
        onConfirmSecondary={deleteChatAndConnection}
      />
      <ModalBottomHalf visible={showFilterOptions} onClose={closeFilterOptions}>
        <ChatFilterOptions
          options={[
            { id: '1', name: 'allChats', value: 'all' },
            { id: '2', name: 'archived', value: 'archived' },
          ]}
          selectedOption={category}
          onChangeOption={onChangeFilterOption}
        />
      </ModalBottomHalf>
    </>
  )
}

export default SubChats
