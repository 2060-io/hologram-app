import { StackActions, useNavigation } from '@react-navigation/native'
import defaultAvatar from '@src/assets/images/defaultUser.png'
import { ConnectionRefusedByAge, SvgIcon, Text, VerifiedIcon } from '@src/components/common'
import Avatar from '@src/components/common/Avatar/Avatar'
import { useFetchServiceInfo } from '@src/hooks'
import { useChats, useChatThreadById, useUserProfile } from '@src/hooks/agent'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { useValidateKidAgeRestrictions } from '@src/hooks/useValidateKidAgeRestrictions'
import { ChatEntryRole, InvitationMetadata, ServiceStatus } from '@src/model'
import { InvitationState } from '@src/model/InvitationState'
import { MobileAgent } from '@src/services/agent/MobileAgent'
import { toast } from '@src/utils/toast'
import React, { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, TouchableOpacity, View } from 'react-native'
import { BlueButton, Header } from '../components'
import getStyles from './styles'

interface Props {
  associatedRecordId: string
  metadata: InvitationMetadata
  role: ChatEntryRole
  agent?: MobileAgent
}
const isService = (did?: string) => did !== undefined && !did.startsWith('did:peer')

const InvitationChatView = ({ associatedRecordId: outOfBandId, metadata, role, agent }: Props) => {
  const { activeChatThreadId } = useChats()
  const chatThread = useChatThreadById(activeChatThreadId ?? '')
  const { userProfileData } = useUserProfile()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { t } = useTranslation()
  const navigation = useNavigation()
  const isReceiver = role === ChatEntryRole.Receiver
  const defaultUserImg = Image.resolveAssetSource(defaultAvatar).uri
  const { imageUrl, label, did, state } = metadata
  const invitationType = t(isService(did) ? 'chat.invitationRequestService' : 'chat.invitationRequestSubConnection')
  const { serviceInfo } = useFetchServiceInfo({ did, alwaysFetch: true })
  const minimumAgeRequired = serviceInfo?.minimumAgeRequired ?? 0
  const serviceStatus = serviceInfo?.status ?? ServiceStatus.Resolving
  const { kidAge, ageRestricted } = useValidateKidAgeRestrictions({ minimumAgeRequired, serviceStatus })

  const goToInvitation = async () => {
    const outOfBandRecord = await agent?.didcomm.oob.findById(outOfBandId)
    if (outOfBandRecord) navigation.dispatch(StackActions.push('ConnectionInvitation', { outOfBandRecord }))
  }
  const goToExistingConnection = async () => {
    if (!agent) return
    const [connection] = await agent.didcomm.connections.findAllByOutOfBandId(outOfBandId)
    if (connection) {
      navigation.dispatch(StackActions.push('ConnectionDetails', { connectionId: connection.id }))
    } else {
      toast({ type: 'error', message: `${t('chat.invitationConnectionNotFound')}` })
    }
  }

  const footer: Partial<Record<InvitationState, React.ReactElement>> = {
    [InvitationState.Received]: (
      <>
        <BlueButton
          disabled={ageRestricted}
          text={t('general.connect')}
          onPress={goToInvitation}
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
        <Text fontFamily="EuclidCircularA-Bold" style={styles.acceptedText}>
          {t('chat.acceptedInvitation')}
        </Text>
      </View>
    ),
    [InvitationState.AlreadyConnected]: (
      <BlueButton
        text={t('chat.alreadyConnected')}
        style={styles.acceptWithAgeRestricted}
        onPress={goToExistingConnection}
      />
    ),
  }

  const renderFooter = useMemo(() => {
    return footer[state]
  }, [state, ageRestricted, theme.colors])

  return (
    <>
      <Header
        theme={theme}
        leftIconName="personAdd"
        rightIcon={
          state !== InvitationState.Refused && isReceiver ? (
            <TouchableOpacity
              disabled={ageRestricted && state === InvitationState.Received}
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
          <Text fontFamily="EuclidCircularA-Medium" style={styles.label}>
            {serviceInfo?.name || label}
          </Text>
        </View>
        <Text style={styles.subTitle}>
          {isReceiver ? t('chat.invitationDescription') : t('chat.sentInvitationDescription')}
          <Text fontFamily="EuclidCircularA-SemiBold" style={styles.textSemiBold}>
            {' '}
            {serviceInfo?.name || label}
          </Text>
          {!isService && t('chat.asASubConnectionOf')}
          {!isService && (
            <Text fontFamily="EuclidCircularA-SemiBold" style={styles.textSemiBold}>
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
