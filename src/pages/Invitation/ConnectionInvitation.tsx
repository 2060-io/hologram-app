import { ConnectionRecord } from '@credo-ts/core'
import { StackActions } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import { TrustResolutionOutcome } from '@verana-labs/verre'
import React, { useLayoutEffect, useState, useRef, useTransition } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity, View, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import AlreadyConnected from './AlreadyConnected'
import PublicService from './PublicService'
import getStyles from './styles'

import { CommunicationChannels } from '@2060/components'
import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { Avatar, HeaderTitle, ModalLoading, Text } from '@2060/components/common'
import { useChats, useConnectionById, useMobileAgent, useUserProfile } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { ServiceInfo } from '@2060/model'
import { acceptInvitation } from '@2060/services/agent/oob'
import { logError } from '@2060/utils'
import { getConnectionDisplayName } from '@2060/utils/connectionUtils'
import { toast } from '@2060/utils/toast'

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

interface Props extends StackScreenProps<NavigationStackParams, 'ConnectionInvitation'> {}

const ConnectionInvitation: React.FC<Props> = ({ navigation, route }: Props) => {
  const { outOfBandRecord, existingConnectionId } = route.params
  const isAlreadyConnected = !!existingConnectionId
  const [isAcceptingInvitation, startAcceptInvitationTransition] = useTransition()
  const [communicationChannels, setCommunicationChannels] = useState({
    allowChats: true,
    allowAudioCalls: false,
    allowVideoCalls: false,
  })
  const invitation = outOfBandRecord?.outOfBandInvitation
  const invitationDid = invitation.invitationDids[0]
  const serviceInfo = useRef<ServiceInfo>({
    did: invitationDid,
    description: invitation.label,
    id: invitation.id,
    logoUrl: invitation.imageUrl,
    name: invitation.label ?? '',
    minimumAgeRequired: 0,
    status: TrustResolutionOutcome.INVALID,
  })

  const { t } = useTranslation()
  const { agent } = useMobileAgent()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { findOrCreateThread } = useChats()
  const { userProfileData } = useUserProfile()
  const outOfBandId = outOfBandRecord.id
  const parentConnectionId = outOfBandRecord.getTag('parentConnectionId') as string | undefined
  const invitationType = getInvitationType(invitationDid, parentConnectionId)
  const connectionParent = useConnectionById(parentConnectionId)
  const parentConnectionName = connectionParent ? getConnectionDisplayName(connectionParent) : ''
  const [ageRestricted, setAgeRestricted] = useState(false)
  const canConnect = !isAlreadyConnected && !ageRestricted

  const goToChat = (connection: ConnectionRecord) => {
    const chatThreadId = findOrCreateThread({ connection }).id
    navigation.dispatch(
      StackActions.replace('PersonalChatStack', {
        screen: 'PersonalChat',
        params: { chatThreadId, redirectToHomeOnBack: true },
      }),
    )
  }

  const onPressHeaderLeftButton = () => {
    if (navigation.canGoBack()) navigation.goBack()
    else navigation.dispatch(StackActions.replace('Home'))
  }

  const onPressHeaderRightButton = async () => {
    if (canConnect) {
      accept()
    } else {
      if (isAlreadyConnected) {
        const connection = await agent?.connections.getById(existingConnectionId!)
        if (connection) goToChat(connection)
      } else {
        navigation.goBack()
      }
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
      <ScrollView showsVerticalScrollIndicator={false}>
        <ModalLoading visible={isAcceptingInvitation} />
        <View style={styles.subContainer}>
          {isAlreadyConnected && (
            <AlreadyConnected
              navigation={navigation}
              connectionId={existingConnectionId}
              includeDefaultActions={true}
            />
          )}
          {invitationType === 'public' ? (
            <PublicService
              did={invitationDid}
              initialServiceInfo={serviceInfo.current}
              setAgeRestricted={setAgeRestricted}
              userName={userProfileData?.displayName}
            />
          ) : (
            <View>
              <View style={styles.card}>
                <Avatar uri={invitation?.imageUrl} label={invitation?.label} size="25%" withBorder={true} />
                <Text fontFamily="EuclidCircularA-Medium" style={styles.invitationLabel}>
                  {invitation?.label}
                </Text>
                {invitationType === 'peer' && (
                  <Text style={styles.content}>
                    {t('invitation.peerInvitationDescription', { label: invitation?.label })}
                  </Text>
                )}
                {invitationType === 'subInvitation' && (
                  <Text style={styles.content}>
                    {t('invitation.subConnectionInvitationDescription')}{' '}
                    <Text fontFamily="EuclidCircularA-Bold" style={styles.fontFamilyBold}>
                      {`${invitation?.label} `}{' '}
                    </Text>
                    {t('invitation.subConnectionInvitationDescriptionAs')}{' '}
                    <Text fontFamily="EuclidCircularA-Bold" style={styles.fontFamilyBold}>
                      {parentConnectionName}
                    </Text>
                  </Text>
                )}
              </View>
              {!isAlreadyConnected && invitationType === 'peer' && (
                <View style={styles.card}>
                  <Text style={styles.enabledChannelsText}>
                    {`${invitation?.label} ${t('invitation.enabledCommunicationChannelsDescription')}`}
                  </Text>
                  <View style={styles.separator} />
                  <CommunicationChannels
                    channels={communicationChannels}
                    setChannels={setCommunicationChannels}
                  />
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default ConnectionInvitation
