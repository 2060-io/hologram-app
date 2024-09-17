import { StackActions } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useLayoutEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity, View, ScrollView } from 'react-native'

import getStyles from './styles'

import { CommunicationChannels } from '@2060/components'
import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { Avatar, HeaderTitle, ModalLoading, Text, ServiceInformation } from '@2060/components/common'
import { useChats, useConnectionById, useMobileAgent, useUserProfile } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { acceptInvitation } from '@2060/services/agent/oob'
import { ServiceInfo } from '@2060/services/api/trustRegistryService'
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

const invitationTypeTitles: Partial<Record<InvitationType, string>> = {
  peer: 'invitationPeer',
  public: 'invitationPublic',
}

interface Props extends StackScreenProps<NavigationStackParams, 'ConnectionInvitation'> {}

const ConnectionInvitation: React.FC<Props> = ({ navigation, route }: Props) => {
  const { outOfBandRecord } = route.params
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
    status: 'notFound',
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

  const onRefuse = () => {
    if (navigation.canGoBack()) navigation.goBack()
    else navigation.dispatch(StackActions.replace('Home'))
  }

  const onFinishAddingConnection = () => setIsAcceptingInvitation(false)

  const onAccept = async () => {
    const invitationOptions = {
      outOfBandId,
      label: userProfileData?.displayName,
      connectionId: parentConnectionId,
    }
    setIsAcceptingInvitation(true)
    try {
      if (!agent) throw new Error('Agent not initialized')
      const { connectionRecord } = await acceptInvitation(agent.context, invitationOptions)
      const chatThreadId = findOrCreateThread({ connection: connectionRecord! }).id
      navigation.dispatch(
        StackActions.replace('PersonalChatStack', { screen: 'PersonalChat', params: { chatThreadId } }),
      )
    } catch (error) {
      toast({ type: 'error', message: `Failed to add connection ${error}` })
    } finally {
      onFinishAddingConnection()
    }
  }

  const handleChangeHeaderOptions = () => {
    navigation.setOptions({
      headerTitle: () => (
        <HeaderTitle
          title={t(`invitation.${invitationTypeTitles[invitationType] ?? 'invitation'}`)}
          theme={theme}
        />
      ),
      headerLeft: () => (
        <TouchableOpacity style={styles.btnRefuse} onPress={onRefuse}>
          <Text typography="EuclidCircularA-Medium" style={styles.headerBtnText}>
            {t('general.refuse')}
          </Text>
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity style={styles.btnAccept} onPress={onAccept}>
          <Text typography="EuclidCircularA-Medium" style={styles.headerBtnText}>
            {t('general.accept')}
          </Text>
        </TouchableOpacity>
      ),
    })
  }

  useLayoutEffect(handleChangeHeaderOptions, [invitationType])

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.root}>
        <ModalLoading visible={isAcceptingInvitation} />
        {invitationType === 'public' ? (
          <ServiceInformation did={invitationDid} serviceInfoRef={serviceInfo} />
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
