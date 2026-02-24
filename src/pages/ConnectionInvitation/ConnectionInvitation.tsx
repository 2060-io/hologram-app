import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import BaseConnectionInvitation, { ConnectionInvitationProps } from './BaseConnectionInvitation'
import ConnectionInvitationForVerifiableService from './ConnectionInvitationForVerifiableService'
import getStyles from './styles'

import { CommunicationChannels } from '@src/components'
import { Avatar, Text } from '@src/components/common'
import { useConnectionById } from '@src/hooks/agent'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { getConnectionDisplayName } from '@src/utils/connectionUtils'

const ConnectionInvitation = ({ navigation, route }: ConnectionInvitationProps) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const [communicationChannels, setCommunicationChannels] = useState({
    allowChats: true,
    allowAudioCalls: false,
    allowVideoCalls: false,
  })
  const { outOfBandRecord, existingConnectionId } = route.params
  const invitation = outOfBandRecord?.outOfBandInvitation
  const parentConnectionId = outOfBandRecord.getTag('parentConnectionId') as string | undefined
  const connectionParent = useConnectionById(parentConnectionId)
  const invitationType = parentConnectionId ? 'subInvitation' : 'peer'
  const parentConnectionName = connectionParent ? getConnectionDisplayName(connectionParent) : ''
  const isAlreadyConnected = !!existingConnectionId

  return (
    <BaseConnectionInvitation
      navigation={navigation}
      route={route}
      mainInfo={
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
      }
    />
  )
}

const ConnectionInvitationWrapper = (props: ConnectionInvitationProps) => {
  const { route } = props
  const { outOfBandRecord } = route.params
  const invitation = outOfBandRecord?.outOfBandInvitation
  const invitationDid = invitation.invitationDids[0]
  const isService = invitationDid !== undefined && !invitationDid.startsWith('did:peer')
  if (isService) return <ConnectionInvitationForVerifiableService {...props} />
  return <ConnectionInvitation {...props} />
}

export default ConnectionInvitationWrapper
