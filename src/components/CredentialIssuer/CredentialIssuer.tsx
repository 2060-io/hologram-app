import { ConnectionRecord } from '@credo-ts/core'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, TouchableOpacity, View } from 'react-native'

import getStyles from './styles'

import { Avatar, Icon, MainButton, SvgIcon, Text, VerifiedIcon } from '@2060/components/common'
import { useChats } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { MobileAgent } from '@2060/services/agent'
import { ServiceInfo, ServiceStatus } from '@2060/services/api'
import { getFlagEmoji, trimText } from '@2060/utils'

type Props = {
  service: ServiceInfo
  connect: (service: ServiceInfo) => Promise<ConnectionRecord | null>
  tryToOpenURL: (url: string) => void
  goToConnectionDetails: (connectionId: string) => void
  goToChat: (chatThreadId: string) => void
  agent: MobileAgent | undefined
}
const CredentialIssuer = ({
  service,
  connect,
  tryToOpenURL,
  goToConnectionDetails,
  goToChat,
  agent,
}: Props) => {
  const {
    logoUrl,
    name,
    description,
    did,
    status,
    dataPrivacyUrl,
    termsAndConditionsUrl,
    minimumAgeRequired,
  } = service
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { findOrCreateThread } = useChats()
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionExists, setConnectionExists] = useState(false)
  const connectionRef = useRef<ConnectionRecord>()

  useEffect(() => {
    const verifyConnectionExists = async () => {
      if (!agent) return
      const [connection] = await agent.connections.findByInvitationDid(did)
      setConnectionExists(!!connection)
      connectionRef.current = connection
    }
    verifyConnectionExists()
  }, [agent])

  const connectToService = async () => {
    setIsConnecting(true)
    const connection = await connect(service)
    if (connection) {
      setConnectionExists(true)
      connectionRef.current = connection
      const chatThreadId = findOrCreateThread({ connection }).id
      goToChat(chatThreadId)
    }
    setIsConnecting(false)
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Avatar uri={logoUrl} label={name} size="20%" />
        <View style={styles.headerCenterContainer}>
          <Text typography="EuclidCircularA-Medium" style={styles.issuerName}>
            {name}
          </Text>
          <Text typography="EuclidCircularA-Bold" style={styles.text}>
            {trimText(did)}
          </Text>
        </View>
        <VerifiedIcon style={styles.containerIconValidity} status={status as ServiceStatus} />
      </View>
      <View style={styles.rowContainer}>
        <Text typography="EuclidCircularA-Bold" style={styles.text}>
          {t('credential.serviceProvider')}
        </Text>
        <Text typography="EuclidCircularA-Medium" style={styles.text}>
          {`${getFlagEmoji('EE')} 2060 OÜ`}
        </Text>
      </View>
      <View style={styles.rowContainer}>
        <Text typography="EuclidCircularA-Bold" style={styles.text}>
          {t('credential.reputation')}
        </Text>
        <View style={styles.starsContainer}>
          {Array.from({ length: 5 }).map((_, index) => (
            <Icon key={index} as="FontAwesome" name="star" size={14} color="gold" style={styles.star} />
          ))}
        </View>
      </View>
      <View style={styles.rowContainer}>
        <Text typography="EuclidCircularA-Bold" style={styles.text}>
          {t('credential.issuedCredentials')}
        </Text>
        <Text typography="EuclidCircularA-Medium" style={styles.text}>
          2,354,768
        </Text>
      </View>
      <View style={styles.rowContainer}>
        <Text typography="EuclidCircularA-Bold" style={styles.text}>
          {t('credential.verifiedCredentials')}
        </Text>
        <Text typography="EuclidCircularA-Medium" style={styles.text}>
          142,345,768
        </Text>
      </View>
      <View style={styles.rowContainer}>
        <Text typography="EuclidCircularA-Bold" style={styles.text}>
          {t('invitation.ageRestrictions')}
        </Text>
        <Text typography="EuclidCircularA-Medium" style={styles.text}>
          {`${minimumAgeRequired}+`}
        </Text>
      </View>
      <Text typography="EuclidCircularA-Medium" style={[styles.text, { marginVertical: 10 }]}>
        {description}
      </Text>
      {termsAndConditionsUrl && (
        <TouchableOpacity style={styles.urlContainer} onPress={() => tryToOpenURL(termsAndConditionsUrl)}>
          <Text style={[styles.text, styles.underLineText]}>{t('invitation.termsAndConditions')}</Text>
          <SvgIcon name="arrowUpRightFromSquare" fill={theme.colors.primaryText} width={15} height={15} />
        </TouchableOpacity>
      )}
      {dataPrivacyUrl && (
        <TouchableOpacity style={styles.urlContainer} onPress={() => tryToOpenURL(dataPrivacyUrl)}>
          <Text style={[styles.text, styles.underLineText]}>{t('invitation.privacyPolicy')}</Text>
          <SvgIcon name="arrowUpRightFromSquare" fill={theme.colors.primaryText} width={15} height={15} />
        </TouchableOpacity>
      )}
      {connectionExists ? (
        <>
          <Text typography="EuclidCircularA-Bold" style={[styles.text, styles.alreadyConnectedText]}>
            {t('connection.youAreAlreadyConnectedTo', { name: service.name })}
          </Text>
          <MainButton
            text={t('connection.goToConnection')}
            style={styles.button}
            onPress={() => goToConnectionDetails(connectionRef.current!.id)}
          />
        </>
      ) : isConnecting ? (
        <ActivityIndicator color={theme.colors.green} size="large" />
      ) : (
        <MainButton text={t('connection.connect')} style={styles.button} onPress={connectToService} />
      )}
    </View>
  )
}

export default CredentialIssuer
