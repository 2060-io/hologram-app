import { ConnectionRecord } from '@credo-ts/core'
import { StackActions } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import React, { ReactElement, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native'

import getStyles from './styles'

import { ModalConfirmAction } from '@2060/components'
import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { Text, ChannelIcons, SvgIcon, ModalLoading, OptionsList } from '@2060/components/common'
import { ChannelProps } from '@2060/components/common/ChannelIcons/ChannelIcons'
import { IS_DEVICE_IOS } from '@2060/constants'
import {
  useConnectionProfile,
  useMobileAgent,
  useChats,
  useConnectionByParentConnectionId,
} from '@2060/hooks/agent'
import { deleteConnection, blockConnection, unblockConnection } from '@2060/hooks/agent/connections'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { MobileAgent } from '@2060/services/agent'
import { capitalizeFirstLetter, log } from '@2060/utils'
import {
  getConnectionDisplayName,
  isBlocked,
  isTerminated,
  supportsUserProfile,
} from '@2060/utils/connectionUtils'
import { markNewConnectionNotificationAsViewed } from '@2060/utils/pushNotificationsUtils'
import { toast } from '@2060/utils/toast'

type confirmationTypes = 'deleteChat' | 'block' | 'unblock' | 'deleteConnection'
export interface WrapperProps extends StackScreenProps<NavigationStackParams, 'ConnectionDetails'> {}

export interface ConnectionDetailsProps extends WrapperProps {
  connection: ConnectionRecord
}

export interface BaseConnectionDetailsProps extends ConnectionDetailsProps {
  mainInfo: ReactElement
  footerInfo?: ReactElement
}

const BaseConnectionDetails = ({
  navigation,
  connection,
  mainInfo,
  footerInfo,
}: BaseConnectionDetailsProps) => {
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)
  const [blockingConnection, setBlockingConnection] = useState(false)
  const modalConfirmationTypeRef = useRef<confirmationTypes>('deleteChat')
  const theme = useTheme()
  const styles = getStyles(theme)

  const profile = useConnectionProfile(connection.id)
  const { agent } = useMobileAgent()
  const { t } = useTranslation()
  const connectionName = getConnectionDisplayName(connection)
  const relatedConnections = useConnectionByParentConnectionId(connection.id)

  const isConnectionCompleted = connection.isReady
  const isConnectionBlocked = isBlocked(connection)
  const isConnectionTerminated = isTerminated(connection)

  const { clearThread, findOrCreateThread } = useChats()

  const setHeaderOptions = () => {
    navigation.setOptions({
      headerLeft: () => null,
      headerRight: () => (
        <TouchableOpacity style={styles.headerRight} onPress={() => navigation.goBack()}>
          <Text style={styles.headerBtnText} typography="EuclidCircularA-Medium">
            {t('general.done')}
          </Text>
        </TouchableOpacity>
      ),
    })
  }

  useEffect(() => {
    setHeaderOptions()
    markNewConnectionNotificationAsViewed(connection.id)
  }, [])

  const goToRelatedConnections = () => {
    navigation.navigate('RelatedConnections', { parentConnectionId: connection.id })
  }

  const openConfirmationModal = (confirmationType: confirmationTypes) => {
    modalConfirmationTypeRef.current = confirmationType
    setShowConfirmationModal(true)
  }

  const closeConfirmationModal = () => setShowConfirmationModal(false)

  const goToChat = async () => {
    if (!agent) throw new Error('Agent not defined')
    if (!connection) throw new Error('Connection not defined')
    const chatThreadId = findOrCreateThread({ connection }).id
    navigation.dispatch(
      StackActions.push('PersonalChatStack', { screen: 'PersonalChat', params: { chatThreadId } }),
    )
  }

  const handleDeleteConnection = async () => {
    if (agent) {
      try {
        await deleteConnection(agent, connection)
        if (navigation.canGoBack()) navigation.goBack()
      } catch (error) {
        toast({ message: `${error}`, type: 'error' })
      }
    }
  }

  const toggleBlock = async (action: (agent: MobileAgent, record: ConnectionRecord) => Promise<void>) => {
    if (!agent) return
    setTimeout(
      async () => {
        setBlockingConnection(true)
        try {
          await action(agent, connection)
        } catch (error) {
          toast({ type: 'error', message: `${error}` })
        } finally {
          setBlockingConnection(false)
        }
      },
      IS_DEVICE_IOS ? 600 : 0,
    )
  }

  const clearChat = () => {
    let thread = findOrCreateThread({ connection })
    clearThread(thread.id)
  }

  const onPressConfirmation = () => {
    closeConfirmationModal()
    const actions = {
      deleteChat: () => clearChat(),
      deleteConnection: async () => await handleDeleteConnection(),
      block: async () => await toggleBlock(blockConnection),
      unblock: async () => await toggleBlock(unblockConnection),
    }
    actions[modalConfirmationTypeRef.current]()
  }

  const getUserProfile = async () => {
    if (!profile || (profile && Object.keys(profile).length === 0)) {
      if (supportsUserProfile(connection)) {
        try {
          await agent?.modules.profile.requestUserProfile({ connectionId: connection.id })
        } catch (error) {
          log(`Cannot get user profile: ${error}`)
        }
      }
    }
  }

  useEffect(() => {
    getUserProfile()
  }, [profile])

  const relatedConnectionsOption = {
    iconName: 'users',
    text: t('connection.managedConnections'),
    onPress: goToRelatedConnections,
    rightContent: () => (
      <>
        <Text typography="EuclidCircularA-Regular" style={styles.accountText}>
          {relatedConnections.length}
        </Text>
        <SvgIcon name="chevronForward" fill={theme.colors.primaryText} width={16} height={16} />
      </>
    ),
  }

  const mainOptions = relatedConnections.length ? [relatedConnectionsOption] : []

  const connectionOptions = []
  connectionOptions.push({
    iconName: 'trash',
    text: t('connection.clearChat'),
    onPress: () => openConfirmationModal('deleteChat'),
  })
  if (isConnectionCompleted && !isConnectionTerminated) {
    connectionOptions.push({
      iconName: 'block',
      text: t(`connection.${isConnectionBlocked ? 'unblock' : 'block'}`),
      onPress: () => openConfirmationModal(isConnectionBlocked ? 'unblock' : 'block'),
    })
  }
  connectionOptions.push({
    iconName: 'personRemove',
    text: t('connection.deleteConnection'),
    onPress: () => openConfirmationModal('deleteConnection'),
  })

  connectionOptions.push({
    iconName: 'forward',
    text: t('personalChat.forward'),
    onPress: () => navigation.navigate('ForwardConnection', { connectionId: connection.id }),
  })

  const channels: ChannelProps[] = [{ value: 'text', onPress: goToChat }]

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.subContainer}>
          <ModalLoading
            visible={blockingConnection}
            message={isConnectionBlocked ? t('connection.unblocking') : t('connection.blocking')}
          />
          {mainInfo}
          {isConnectionTerminated && (
            <View style={[styles.blockedContainer, styles.statusMainContainer]}>
              <Text typography="EuclidCircularA-Regular" style={styles.blockedText}>
                {t('connection.terminated')}
              </Text>
            </View>
          )}
          {isConnectionBlocked && (
            <View style={[styles.blockedContainer, styles.statusMainContainer]}>
              <Text typography="EuclidCircularA-Regular" style={styles.blockedText}>
                {t('connection.blocked')}
              </Text>
            </View>
          )}
          {!isConnectionCompleted && (
            <View style={[styles.waitingContainer, styles.statusMainContainer]}>
              <Text typography="EuclidCircularA-Regular" style={styles.pendingText}>
                {t('connection.pending')}
              </Text>
            </View>
          )}
          <View style={styles.nameContainer}>
            <Text typography="EuclidCircularA-Regular" style={styles.displayName}>
              {connectionName}
            </Text>
            <ChannelIcons
              defaultChannels={channels}
              connection={connection}
              iconColor={theme.colors.primaryText}
            />
          </View>
          <OptionsList options={mainOptions} />
          {mainOptions.length > 0 && <View style={styles.divisor} />}
          <OptionsList options={connectionOptions} />
          {footerInfo}
          <ModalConfirmAction
            visible={showConfirmationModal}
            title={t(`connection.title${capitalizeFirstLetter(modalConfirmationTypeRef.current)}`)}
            subTitle={t(`connection.subTitle${capitalizeFirstLetter(modalConfirmationTypeRef.current)}`)}
            confirmText={t('general.confirm')}
            cancelText={t('general.cancel')}
            onClose={closeConfirmationModal}
            onConfirm={onPressConfirmation}
            onCancel={closeConfirmationModal}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default BaseConnectionDetails
