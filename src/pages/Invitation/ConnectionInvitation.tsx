import { StackActions } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import { TrustResolutionOutcome } from '@verana-labs/verre'
import React, { useLayoutEffect, useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity, View, ScrollView } from 'react-native'

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
  const [isAcceptingInvitation, setIsAcceptingInvitation] = useState(false)
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
  const chatThreadId = useRef<string>()
  const outOfBandId = outOfBandRecord.id
  const parentConnectionId = outOfBandRecord.getTag('parentConnectionId') as string | undefined
  const invitationType = getInvitationType(invitationDid, parentConnectionId)
  const connectionParent = useConnectionById(parentConnectionId)
  const parentConnectionName = connectionParent ? getConnectionDisplayName(connectionParent) : ''
  const [ageRestricted, setAgeRestricted] = useState(false)
  const canConnect = !isAlreadyConnected && !ageRestricted

  useEffect(() => {
    if (!isAcceptingInvitation && chatThreadId.current) {
      navigation.dispatch(
        StackActions.replace('PersonalChatStack', {
          screen: 'PersonalChat',
          params: { chatThreadId: chatThreadId.current },
        }),
      )
    }
  }, [isAcceptingInvitation])

  const onRefuse = () => {
    if (navigation.canGoBack()) navigation.goBack()
    else navigation.dispatch(StackActions.replace('Home'))
  }

  const onFinishAddingConnection = () => setIsAcceptingInvitation(false)

  const onPressRightButton = () => {
    canConnect ? accept() : navigation.goBack()
  }

  const accept = async () => {
    const invitationOptions = {
      outOfBandId,
      label: userProfileData?.displayName,
      connectionId: parentConnectionId,
    }
    setIsAcceptingInvitation(true)
    try {
      if (!agent) throw new Error('Agent not initialized')
      const { connectionRecord } = await acceptInvitation(agent.context, invitationOptions)
      chatThreadId.current = findOrCreateThread({ connection: connectionRecord! }).id
    } catch (error) {
      toast({ type: 'error', message: `Failed to add connection ${error}` })
    } finally {
      onFinishAddingConnection()
    }
  }

  const handleChangeHeaderOptions = () => {
    const headerTitles: Record<InvitationType, string> = {
      peer: t('invitation.invitationPeer'),
      public: t('invitation.invitationPublic'),
      subInvitation: t('invitation.invitation'),
    }
    navigation.setOptions({
      headerTitle: () => <HeaderTitle title={headerTitles[invitationType]} theme={theme} />,
      headerLeft: canConnect
        ? () => (
            <TouchableOpacity style={styles.btnRefuse} onPress={onRefuse}>
              <Text typography="EuclidCircularA-Medium" style={styles.headerBtnText}>
                {t('general.refuse')}
              </Text>
            </TouchableOpacity>
          )
        : () => <></>,
      headerRight: () => (
        <TouchableOpacity style={styles.btnAccept} onPress={onPressRightButton}>
          <Text typography="EuclidCircularA-Medium" style={styles.headerBtnText}>
            {canConnect ? t('general.accept') : t('general.done')}
          </Text>
        </TouchableOpacity>
      ),
    })
  }

  useLayoutEffect(handleChangeHeaderOptions, [canConnect, theme.colors])

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <ModalLoading visible={isAcceptingInvitation} />
      <View style={styles.root}>
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
              <Text typography="EuclidCircularA-Medium" style={styles.invitationLabel}>
                {invitation?.label}
              </Text>
              {invitationType === 'peer' && (
                <Text style={styles.content}>
                  {t('invitation.peerInvitationDescription', { label: invitation?.label })}
                </Text>
              )}
              {invitationType === 'subInvitation' && (
                <Text typography="EuclidCircularA-Regular" style={styles.content}>
                  {t('invitation.subConnectionInvitationDescription')}{' '}
                  <Text typography="EuclidCircularA-Bold" style={styles.fontFamilyBold}>
                    {`${invitation?.label} `}{' '}
                  </Text>
                  {t('invitation.subConnectionInvitationDescriptionAs')}{' '}
                  <Text typography="EuclidCircularA-Bold" style={styles.fontFamilyBold}>
                    {parentConnectionName}
                  </Text>
                </Text>
              )}
            </View>
            {invitationType === 'peer' && (
              <View style={styles.card}>
                <Text typography="EuclidCircularA-Regular" style={styles.enabledChannelsText}>
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
  )
}

export default ConnectionInvitation
