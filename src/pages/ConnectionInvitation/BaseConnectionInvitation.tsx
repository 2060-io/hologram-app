import { DidCommConnectionRecord } from '@credo-ts/didcomm'
import { StackActions } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import { ModalConfirmAction } from '@src/components'
import { HeaderTitle, ModalLoading, Text } from '@src/components/common'
import { NavigationStackParams } from '@src/components/Navigation/NavigationProps'
import { useScrollSwipeDown } from '@src/hooks'
import { useChats, useMobileAgent, useUserProfile } from '@src/hooks/agent'
import { AgentActionType } from '@src/hooks/agent/actions/AgentAction'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { ServiceStatus } from '@src/model'
import { AgentActionQueueSingleton } from '@src/services/AgentActionQueueSingleton'
import { acceptInvitation, acceptInvitationAndWaitForRequest, DidcommInvitationType } from '@src/services/agent/oob'
import { logError } from '@src/utils'
import { screenHeight } from '@src/utils/responsiveUtils'
import { toast } from '@src/utils/toast'
import React, { ReactElement, useLayoutEffect, useRef, useState, useTransition } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AlreadyConnected from './AlreadyConnected'
import getStyles from './styles'

type InvitationType = 'peer' | 'public' | 'subInvitation'

const getInvitationType = (
  invitationDid: string | undefined,
  parentConnectionId: string | undefined
): InvitationType => {
  const isSubInvitation = parentConnectionId as string
  const isService = invitationDid !== undefined && !invitationDid.startsWith('did:peer')

  if (isService) return 'public'
  if (!isService && !isSubInvitation) return 'peer'
  return 'subInvitation'
}

export type ConnectionInvitationProps = StackScreenProps<NavigationStackParams, 'ConnectionInvitation'>

interface BaseConnectionInvitationProps extends ConnectionInvitationProps {
  mainInfo: ReactElement
  ageRestricted?: boolean
  onSwipeDown?: () => void
  disabledSwipeDown?: boolean
  trustStatus?: ServiceStatus
}

const BaseConnectionInvitation = ({
  navigation,
  route,
  mainInfo,
  ageRestricted = false,
  onSwipeDown,
  disabledSwipeDown = true,
  trustStatus,
}: BaseConnectionInvitationProps) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { agent } = useMobileAgent()
  const { findOrCreateThread } = useChats()
  const { userProfileData } = useUserProfile()
  const [isAcceptingInvitation, startAcceptInvitationTransition] = useTransition()
  const { handleScrollBeginDrag, handleScrollEndDrag } = useScrollSwipeDown({
    disabledSwipeDown,
    onSwipeDown,
  })
  const { outOfBandRecord, existingConnectionId } = route.params
  const invitation = outOfBandRecord?.outOfBandInvitation
  const invitationDid = invitation.invitationDids[0]
  const outOfBandId = outOfBandRecord.id
  const parentConnectionId = outOfBandRecord.getTag('parentConnectionId') as string | undefined
  const invitationType = getInvitationType(invitationDid, parentConnectionId)
  const isAlreadyConnected = !!existingConnectionId
  const isResolvingTrust = trustStatus === ServiceStatus.Resolving
  const canConnect = !isAlreadyConnected && !ageRestricted && !isResolvingTrust
  const isSafeToConnect = trustStatus === undefined || trustStatus === ServiceStatus.Trusted
  const hasAttachedRequest = Boolean(invitation.getRequests()?.length)
  const [showModalUnsafeConnect, setShowModalUnsafeConnect] = useState(false)
  const isAccepting = useRef(false)

  const goToChat = (connection: DidCommConnectionRecord) => {
    const chatThreadId = findOrCreateThread({ connection }).id
    navigation.dispatch(
      StackActions.replace('ChatStack', {
        screen: 'Chat',
        params: { chatThreadId, redirectToHomeOnBack: true },
      })
    )
  }

  const onPressHeaderLeftButton = () => {
    if (navigation.canGoBack()) navigation.goBack()
    else navigation.dispatch(StackActions.replace('Home'))
  }

  const onPressHeaderRightButton = async () => {
    if (canConnect && !isSafeToConnect) setShowModalUnsafeConnect(true)
    else if (canConnect) accept()
    else if (isAlreadyConnected) {
      const connection = await agent?.didcomm.connections.findById(existingConnectionId!)
      if (connection) goToChat(connection)
    } else {
      navigation.goBack()
    }
  }

  const onUnsafeConnect = () => {
    setShowModalUnsafeConnect(false)
    accept()
  }

  const goToAttachedRequest = async () => {
    if (!agent) return
    const result = await acceptInvitationAndWaitForRequest(
      agent,
      invitation,
      outOfBandRecord,
      undefined,
      userProfileData?.displayName
    )
    if (!result.success) throw new Error(result.error)
    if (result.invitationType === DidcommInvitationType.CredentialOffer) {
      navigation.dispatch(
        StackActions.replace('DidcommCredentialOffer', { credentialRecordId: result.recordId, did: invitationDid })
      )
    } else if (result.invitationType === DidcommInvitationType.PresentationRequest) {
      navigation.dispatch(
        StackActions.replace('DidcommPresentationRequest', { proofRecordId: result.recordId, did: invitationDid })
      )
    } else {
      navigation.dispatch(StackActions.replace('EphemeralCredentialPresentation', { proofRecordId: result.recordId }))
    }
  }

  const accept = async () => {
    if (!agent || isAccepting.current) return
    isAccepting.current = true
    startAcceptInvitationTransition(async () => {
      try {
        if (hasAttachedRequest) {
          await goToAttachedRequest()
          return
        }
        const invitationOptions = {
          outOfBandId,
          label: userProfileData?.displayName,
          connectionId: parentConnectionId,
        }
        const { connectionRecord } = await acceptInvitation(agent.context, invitationOptions)
        if (connectionRecord) {
          // V2 OOB has no handshake; queue a trust-ping so the inviter creates the
          // connection on its side.
          if (connectionRecord.didcommVersion === 'v2') {
            AgentActionQueueSingleton.instance.addJob({
              type: AgentActionType.SendTrustPing,
              parameters: { connectionId: connectionRecord.id },
            })
          }
          goToChat(connectionRecord)
        }
      } catch (error) {
        toast({ type: 'error', message: `Failed to add connection ${error}` })
        logError('Error accepting connection invitation', error)
      } finally {
        isAccepting.current = false
      }
    })
  }

  const handleChangeHeaderOptions = () => {
    const headerTitles: Record<InvitationType, string> = {
      peer: t('invitation.invitationPeer'),
      public: t('invitation.invitationPublic'),
      subInvitation: t('invitation.invitation'),
    }
    navigation.setOptions({
      headerTitle: () => <HeaderTitle title={headerTitles[invitationType]} theme={theme} />,
      headerLeft: () => (
        <TouchableOpacity style={styles.btnRefuse} onPress={onPressHeaderLeftButton}>
          <Text fontFamily="EuclidCircularA-Medium" style={styles.headerBtnText}>
            {isAlreadyConnected ? t('general.cancel') : t('general.refuse')}
          </Text>
        </TouchableOpacity>
      ),
      headerRight: () =>
        isResolvingTrust && !isAlreadyConnected ? null : (
          <TouchableOpacity
            style={styles.btnAccept}
            onPress={onPressHeaderRightButton}
            testID={canConnect ? (isSafeToConnect ? 'invitation-accept' : 'invitation-accept-unsafe') : undefined}
          >
            <Text
              fontFamily="EuclidCircularA-Medium"
              style={[styles.headerBtnText, canConnect && !isSafeToConnect && styles.unsafeBtnText]}
            >
              {canConnect ? t('general.accept') : t('general.done')}
            </Text>
          </TouchableOpacity>
        ),
    })
  }

  useLayoutEffect(handleChangeHeaderOptions, [canConnect, isSafeToConnect, isResolvingTrust, theme.colors])

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ minHeight: screenHeight + 1 }}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
      >
        <ModalLoading visible={isAcceptingInvitation} />
        <ModalConfirmAction
          visible={showModalUnsafeConnect}
          title={t('invitation.confirmUnsafeConnect')}
          subTitle=""
          confirmText={t('invitation.connectAnyway')}
          cancelText={t('general.cancel')}
          onClose={() => setShowModalUnsafeConnect(false)}
          onConfirm={onUnsafeConnect}
          onCancel={() => setShowModalUnsafeConnect(false)}
        />
        <View style={styles.subContainer}>
          {isAlreadyConnected && (
            <AlreadyConnected
              navigation={navigation}
              connectionId={existingConnectionId}
              includeDefaultActions={true}
            />
          )}
          {mainInfo}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default BaseConnectionInvitation
