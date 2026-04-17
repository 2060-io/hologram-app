import { DidCommConnectionRecord } from '@credo-ts/didcomm'
import { StackActions } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import React, { ReactElement, useLayoutEffect, useTransition } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity, View, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import AlreadyConnected from './AlreadyConnected'
import getStyles from './styles'

import { NavigationStackParams } from '@src/components/Navigation/NavigationProps'
import { HeaderTitle, ModalLoading, Text } from '@src/components/common'
import { useScrollSwipeDown } from '@src/hooks'
import { useChats, useMobileAgent, useUserProfile } from '@src/hooks/agent'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { acceptInvitation } from '@src/services/agent/oob'
import { logError } from '@src/utils'
import { screenHeight } from '@src/utils/responsiveUtils'
import { toast } from '@src/utils/toast'

type InvitationType = 'peer' | 'public' | 'subInvitation'

const getInvitationType = (
  invitationDid: string | undefined,
  parentConnectionId: string | undefined,
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
}

const BaseConnectionInvitation = ({
  navigation,
  route,
  mainInfo,
  ageRestricted = false,
  onSwipeDown,
  disabledSwipeDown = true,
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
  const canConnect = !isAlreadyConnected && !ageRestricted

  const goToChat = (connection: DidCommConnectionRecord) => {
    const chatThreadId = findOrCreateThread({ connection }).id
    navigation.dispatch(
      StackActions.replace('ChatStack', {
        screen: 'Chat',
        params: { chatThreadId, redirectToHomeOnBack: true },
      }),
    )
  }

  const onPressHeaderLeftButton = () => {
    if (navigation.canGoBack()) navigation.goBack()
    else navigation.dispatch(StackActions.replace('Home'))
  }

  const onPressHeaderRightButton = async () => {
    if (canConnect) accept()
    else if (isAlreadyConnected) {
      const connection = await agent?.didcomm.connections.findById(existingConnectionId!)
      if (connection) goToChat(connection)
    } else {
      navigation.goBack()
    }
  }

  const accept = async () => {
    if (!agent) return
    startAcceptInvitationTransition(async () => {
      try {
        const invitationOptions = {
          outOfBandId,
          label: userProfileData?.displayName,
          connectionId: parentConnectionId,
        }
        const { connectionRecord } = await acceptInvitation(agent.context, invitationOptions)
        if (connectionRecord) goToChat(connectionRecord)
      } catch (error) {
        toast({ type: 'error', message: `Failed to add connection ${error}` })
        logError('Error accepting connection invitation', error)
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
      headerRight: () => (
        <TouchableOpacity style={styles.btnAccept} onPress={onPressHeaderRightButton}>
          <Text fontFamily="EuclidCircularA-Medium" style={styles.headerBtnText}>
            {canConnect ? t('general.accept') : t('general.done')}
          </Text>
        </TouchableOpacity>
      ),
    })
  }

  useLayoutEffect(handleChangeHeaderOptions, [canConnect, theme.colors])

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ minHeight: screenHeight + 1 }}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
      >
        <ModalLoading visible={isAcceptingInvitation} />
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
