import { StackActions, useNavigation } from '@react-navigation/native'
import { TrustResolutionOutcome } from '@verana-labs/verre'
import React, { memo, useMemo, useTransition } from 'react'
import { useTranslation } from 'react-i18next'
import { View, ActivityIndicator, Image, TouchableOpacity } from 'react-native'

import { BlueButton, Header } from '../components'

import getStyles from './styles'

import defaultAvatar from '@2060/assets/images/defaultUser.png'
import { ConnectionRefusedByAge, SvgIcon, Text, VerifiedIcon } from '@2060/components/common'
import Avatar from '@2060/components/common/Avatar/Avatar'
import { useFetchServiceInfo } from '@2060/hooks'
import { useChatThreadById, useChats, useUserProfile } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { useValidateKidAgeRestrictions } from '@2060/hooks/useValidateKidAgeRestrictions'
import { ChatEntryRole, InvitationMetadata } from '@2060/model'
import { InvitationState } from '@2060/model/InvitationState'
import { MobileAgent } from '@2060/services/agent/MobileAgent'
import { acceptInvitation } from '@2060/services/agent/oob'
import { logError } from '@2060/utils'
import { toast } from '@2060/utils/toast'

interface Props {
  associatedRecordId: string
  metadata: InvitationMetadata
  role: ChatEntryRole
  agent?: MobileAgent
}
const isService = (did?: string) => did !== undefined && !did.startsWith('did:peer')

const InvitationChatView = ({ associatedRecordId: outOfBandId, metadata, role, agent }: Props) => {
  const [isAcceptingInvitation, startAcceptInvitationTransition] = useTransition()
  const { activeChatThreadId, findOrCreateThread } = useChats()
  const chatThread = useChatThreadById(activeChatThreadId ?? '')
  const { userProfileData } = useUserProfile()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { t } = useTranslation()
  const navigation = useNavigation()
  const isReceiver = role === ChatEntryRole.Receiver
  const defaultUserImg = Image.resolveAssetSource(defaultAvatar).uri
  const { imageUrl, label, did, state } = metadata
  const invitationType = t(
    isService(did) ? 'personalChat.invitationRequestService' : 'personalChat.invitationRequestSubConnection',
  )
  const { serviceInfo } = useFetchServiceInfo(did)
  const minimumAgeRequired = serviceInfo?.minimumAgeRequired ?? 0
  const serviceStatus = serviceInfo?.status ?? TrustResolutionOutcome.INVALID
  const { kidAge, ageRestricted } = useValidateKidAgeRestrictions({ minimumAgeRequired, serviceStatus })

  const goToInvitation = async () => {
    const outOfBandRecord = await agent?.oob.findById(outOfBandId)
    if (outOfBandRecord) navigation.dispatch(StackActions.push('ConnectionInvitation', { outOfBandRecord }))
  }
  const onAccept = async () => {
    if (!agent) return
    startAcceptInvitationTransition(async () => {
      try {
        const { connectionRecord } = await acceptInvitation(agent.context, {
          outOfBandId,
          label: userProfileData?.displayName,
        })
        const chatThreadId = findOrCreateThread({ connection: connectionRecord! }).id
        navigation.dispatch(
          StackActions.replace('PersonalChatStack', { screen: 'PersonalChat', params: { chatThreadId } }),
        )
      } catch (error) {
        logError('Error accepting invitation', error)
        toast({ type: 'error', message: `${error}` })
      }
    })
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
    [InvitationState.Received]: (
      <>
        <BlueButton
          disabled={ageRestricted}
          text={t('general.connect')}
          onPress={onAccept}
          style={ageRestricted ? styles.acceptWithAgeRestricted : styles.acceptWithoutAgeRestricted}
        />
        {ageRestricted && (
          <ConnectionRefusedByAge
            style={styles.connectionRefusedByAgeText}
            kidAge={kidAge}
            userName={userProfileData?.displayName}
          />
        )}
      </>
    ),
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
        style={styles.acceptWithAgeRestricted}
        onPress={goToExistingConnection}
      />
    ),
  }

  const renderFooter = useMemo(() => {
    if (isAcceptingInvitation) return <ActivityIndicator color={theme.colors.green} />
    return footer[state]
  }, [isAcceptingInvitation, state, ageRestricted, theme.colors])

  return (
    <>
      <Header
        theme={theme}
        leftIconName="personAdd"
        rightIcon={
          state !== InvitationState.Refused && isReceiver ? (
            <TouchableOpacity
              onPress={state === InvitationState.Received ? goToInvitation : goToExistingConnection}
            >
              <SvgIcon name="info" fill={theme.colors.blue} width={20} height={20} />
            </TouchableOpacity>
          ) : null
        }
        title={invitationType}
      />
      <View style={styles.containerMain}>
        <View style={styles.containerInfo}>
          <View style={styles.containerAvatar}>
            {isService(did) && <VerifiedIcon style={styles.containerVerifiedMark} status={serviceStatus} />}
            <Avatar uri={serviceInfo?.logoUrl ?? imageUrl ?? defaultUserImg} label={label} size="19.16%" />
          </View>
          <Text typography="EuclidCircularA-Medium" style={styles.label}>
            {serviceInfo?.name ?? label}
          </Text>
        </View>
        <Text typography="EuclidCircularA-Regular" style={styles.subTitle}>
          {isReceiver ? t('personalChat.invitationDescription') : t('personalChat.sentInvitationDescription')}
          <Text typography="EuclidCircularA-SemiBold" style={styles.textSemiBold}>
            {' '}
            {serviceInfo?.name ?? label}
          </Text>
          {!isService && t('personalChat.asASubConnectionOf')}
          {!isService && (
            <Text typography="EuclidCircularA-SemiBold" style={styles.textSemiBold}>
              {' '}
              {chatThread?.topic}
            </Text>
          )}
        </Text>
        {isReceiver && <View style={styles.footerContainer}>{renderFooter}</View>}
      </View>
    </>
  )
}

export default memo(InvitationChatView)
