import { ConnectionRecord, TypedArrayEncoder, Buffer } from '@credo-ts/core'
import { StackScreenProps } from '@react-navigation/stack'
import React, { ReactElement, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View, SafeAreaView, ScrollView, TouchableOpacity, Platform } from 'react-native'
import Config from 'react-native-config'
import Share, { ShareOptions } from 'react-native-share'

import getStyles from './styles'

import { ModalConfirmAction } from '@2060/components'
import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { Text, ConnectionMainActions, SvgIcon, ModalLoading, OptionsList } from '@2060/components/common'
import { IS_IOS } from '@2060/constants'
import {
  useMobileAgent,
  useChats,
  useConnectionByParentConnectionId,
  useUserProfile,
} from '@2060/hooks/agent'
import { deleteConnection, blockConnection, unblockConnection } from '@2060/hooks/agent/connections'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { createOobInvitation, MobileAgent } from '@2060/services/agent'
import { capitalizeFirstLetter, logError } from '@2060/utils'
import {
  getConnectionDisplayName,
  isBlocked,
  isService,
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

interface BaseConnectionDetailsProps extends ConnectionDetailsProps {
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

  const { agent } = useMobileAgent()
  const { t } = useTranslation()
  const connectionName = getConnectionDisplayName(connection)
  const relatedConnections = useConnectionByParentConnectionId(connection.id)
  const { userProfileData } = useUserProfile()

  const isConnectionCompleted = connection.isReady
  const isConnectionBlocked = isBlocked(connection)
  const isConnectionTerminated = isTerminated(connection)
  const isConnectionService = isService(connection)

  const { clearChat, findOrCreateThread } = useChats()

  useEffect(() => {
    const requestUserProfile = async () => {
      try {
        await agent?.modules.profile.requestUserProfile({ connectionId: connection.id })
      } catch (error) {
        logError(`Cannot get user profile: ${error}`)
      }
    }
    if (supportsUserProfile(connection)) requestUserProfile()
  }, [])

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
      IS_IOS ? 600 : 0,
    )
  }

  const deleteChat = () => {
    const thread = findOrCreateThread({ connection })
    clearChat(thread.id)
  }

  const onPressConfirmation = () => {
    closeConfirmationModal()
    const actions = {
      deleteChat: () => deleteChat(),
      deleteConnection: async () => await handleDeleteConnection(),
      block: async () => await toggleBlock(blockConnection),
      unblock: async () => await toggleBlock(unblockConnection),
    }
    actions[modalConfirmationTypeRef.current]()
  }

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
  if (isConnectionService) {
    connectionOptions.push({
      iconName: 'forward',
      text: t('personalChat.forward'),
      onPress: () => navigation.navigate('ForwardConnection', { connection }),
    })
    connectionOptions.push({
      iconName: 'shareSocial',
      text: t('connection.share'),
      onPress: () => shareConnection(),
    })
  }

  const shareConnection = async () => {
    try {
      const outOfBandInvitation = createOobInvitation(connection)
      const invitationStr = JSON.stringify(outOfBandInvitation)
      const invitationBase64 = TypedArrayEncoder.toBase64URL(Buffer.from(invitationStr))
      const invitationUrl = `${Config.BASE_INVITATION_URL}?oob=${invitationBase64}`
      const title = t('scanned.titleShare', { displayName: userProfileData?.displayName })
      await Share.open(
        Platform.select<ShareOptions>({
          ios: {
            failOnCancel: false,
            activityItemSources: [
              {
                placeholderItem: { type: 'url', content: invitationUrl },
                item: { default: { type: 'url', content: invitationUrl } },
                linkMetadata: { originalUrl: invitationUrl, url: invitationUrl, title },
              },
            ],
          },
          default: { title, url: invitationUrl, message: title, failOnCancel: false },
        }),
      )
    } catch (error) {
      logError('Error sharing connection', error)
    }
  }

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
            <ConnectionMainActions
              navigation={navigation}
              connectionId={connection.id}
              includeDefaultActions={true}
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
