import { StackActions, useNavigation } from '@react-navigation/native'
import React, { useState, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { View, ActivityIndicator, Image, TouchableOpacity } from 'react-native'

import { BlueButton, Header } from '../components'

import getStyles from './styles'

import { SvgIcon, Text, VerifiedIcon } from '@2060/components/common'
import Avatar from '@2060/components/common/Avatar/Avatar'
import { useFetchServiceInfo } from '@2060/hooks'
import { useChatThreadById, useChats } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { ChatEntryRole, InvitationMetadata } from '@2060/model'
import { InvitationState } from '@2060/model/InvitationState'
import { MobileAgent } from '@2060/services/agent/MobileAgent'
import { acceptInvitation } from '@2060/services/agent/oob'
import { toast } from '@2060/utils/toast'

interface Props {
  associatedRecordId: string
  metadata: InvitationMetadata
  role: ChatEntryRole
  agent?: MobileAgent
}
const isService = (did?: string) => did !== undefined && !did.startsWith('did:peer')

const InvitationChatView = ({ associatedRecordId: outOfBandId, metadata, role, agent }: Props) => {
  const [loadingRequest, setLoadingRequest] = useState(false)
  const { activeChatThread, findOrCreateThread } = useChats()
  const chatThread = useChatThreadById(activeChatThread ?? '')
  const theme = useTheme()
  const styles = getStyles(theme)
  const { t } = useTranslation()
  const navigation = useNavigation()
  const isSender = role === ChatEntryRole.Sender
  const defaultUserImg = Image.resolveAssetSource(require('@2060/assets/images/defaultUser.png')).uri
  const { imageUrl, label, did, state } = metadata
  const invitationType = t(
    isService(did) ? 'personalChat.invitationRequestService' : 'personalChat.invitationRequestSubConnection',
  )
  const { serviceInfo } = useFetchServiceInfo(did)

  const goToInvitation = async () => {
    const outOfBandRecord = await agent?.oob.findById(outOfBandId)
    if (outOfBandRecord) navigation.dispatch(StackActions.push('ConnectionInvitation', { outOfBandRecord }))
  }
  const onAccept = async () => {
    if (!agent) return
    setLoadingRequest(true)

    try {
      const { connectionRecord } = await acceptInvitation(agent.context, {
        outOfBandId,
        connectionId: chatThread.connectionId,
      })
      const chatThreadId = findOrCreateThread({ connection: connectionRecord! }).id
      navigation.dispatch(
        StackActions.replace('PersonalChatStack', { screen: 'PersonalChat', params: { chatThreadId } }),
      )
    } catch (error) {
      toast({ type: 'error', message: `${error}` })
    } finally {
      setLoadingRequest(false)
    }
  }

  const goToExistingConnection = async () => {
    if (!agent) return
    const [connection] = await agent.connections.findAllByOutOfBandId(outOfBandId)
    if (connection) {
      navigation.dispatch(StackActions.push('ConnectionDetails', { connectionId: connection.id }))
    } else {
      toast({ type: 'error', message: `${t('personalChat.invitationConnectionNotFound')}` })
    }
  }

  const footer: Partial<Record<InvitationState, React.ReactElement>> = {
    [InvitationState.Received]: <BlueButton text={t('general.connect')} onPress={onAccept} />,
    [InvitationState.Accepted]: (
      <View style={styles.acceptedContainer}>
        <Text typography="EuclidCircularA-Bold" style={styles.acceptedText}>
          {t('personalChat.acceptedInvitation')}
        </Text>
      </View>
    ),
    [InvitationState.AlreadyConnected]: (
      <BlueButton
        text={t('personalChat.alreadyConnected')}
        style={{ opacity: 0.3 }}
        onPress={goToExistingConnection}
      />
    ),
  }

  return (
    <>
      <Header
        theme={theme}
        leftIconName="personAdd"
        rightIcon={
          <TouchableOpacity
            onPress={state === InvitationState.AlreadyConnected ? goToExistingConnection : goToInvitation}
            disabled={state === InvitationState.Received || state === InvitationState.Refused || isSender}
          >
            <SvgIcon name="info" fill={theme.colors.blue} width={20} height={20} />
          </TouchableOpacity>
        }
        title={invitationType}
      />
      <View style={styles.containerMain}>
        <View style={styles.containerInfo}>
          <View style={styles.containerAvatar}>
            {isService(did) && (
              <VerifiedIcon style={styles.containerVerifiedMark} status={serviceInfo?.status ?? 'notFound'} />
            )}
            <Avatar uri={serviceInfo?.logoUrl ?? imageUrl ?? defaultUserImg} label={label} size="19.16%" />
          </View>
          <Text typography="EuclidCircularA-Medium" style={styles.label}>
            {serviceInfo?.name ?? label}
          </Text>
        </View>
        <Text typography="EuclidCircularA-Regular" style={styles.subTitle}>
          {isSender ? t('personalChat.sentInvitationDescription') : t('personalChat.invitationDescription')}
          <Text typography="EuclidCircularA-SemiBold" style={styles.textSemiBold}>
            {' '}
            {serviceInfo?.name ?? label}{' '}
          </Text>
          {!isService && t('personalChat.asASubConnectionOf')}
          {!isService && (
            <Text typography="EuclidCircularA-SemiBold" style={styles.textSemiBold}>
              {' '}
              {chatThread?.topic}
            </Text>
          )}
        </Text>
        {loadingRequest ? <ActivityIndicator color={theme.colors.green} /> : footer[state]}
      </View>
    </>
  )
}

export default memo(InvitationChatView)
