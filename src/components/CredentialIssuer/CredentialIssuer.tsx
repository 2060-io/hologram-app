import { ConnectionRecord } from '@credo-ts/core'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, TouchableOpacity, View } from 'react-native'

import getStyles from './styles'

import { Avatar, Icon, MainButton, SvgIcon, Text, VerifiedIcon } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { ServiceInfo, ServiceStatus } from '@2060/model'
import { MobileAgent } from '@2060/services/agent'
import { getFlagEmoji, trimText } from '@2060/utils'

type Props = {
  service: ServiceInfo
  connect: (service: ServiceInfo) => Promise<ConnectionRecord | null>
  tryToOpenURL: (url: string) => void
  goToConnectionDetails: (connectionId: string) => void
  agent: MobileAgent | undefined
}
const CredentialIssuer = ({ service, connect, tryToOpenURL, goToConnectionDetails, agent }: Props) => {
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
  const [state, setState] = useState({
    isConnecting: false,
    connectionExists: false,
    isJustConnected: false,
  })
  const connectionRef = useRef<ConnectionRecord>(undefined)

  useEffect(() => {
    const verifyConnectionExists = async () => {
      if (!agent) return
      const [connection] = await agent.connections.findByInvitationDid(did)
      setState(prevState => ({ ...prevState, connectionExists: !!connection, isJustConnected: false }))
      connectionRef.current = connection
    }
    verifyConnectionExists()
  }, [agent])

  const connectToService = async () => {
    setState(prevState => ({ ...prevState, isConnecting: true }))
    const connection = await connect(service)
    if (connection) {
      setState(prevState => ({ ...prevState, connectionExists: true, isJustConnected: true }))
      connectionRef.current = connection
    }
    setState(prevState => ({ ...prevState, isConnecting: false }))
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Avatar uri={logoUrl} label={name} size="20%" />
        <View style={styles.headerCenterContainer}>
          <Text fontFamily="EuclidCircularA-Medium" style={styles.issuerName}>
            {name}
          </Text>
          <Text style={styles.didText}>{trimText(did)}</Text>
        </View>
        <VerifiedIcon style={styles.containerIconValidity} status={status as ServiceStatus} />
      </View>
      <View style={styles.rowContainer}>
        <Text fontFamily="EuclidCircularA-SemiBold" style={styles.text}>
          {t('credential.serviceProvider')}
        </Text>
        <Text style={styles.text}>{`${getFlagEmoji('EE')} 2060 OÜ`}</Text>
      </View>
      <View style={styles.rowContainer}>
        <Text fontFamily="EuclidCircularA-SemiBold" style={styles.text}>
          {t('credential.reputation')}
        </Text>
        <View style={styles.starsContainer}>
          {Array.from({ length: 5 }).map((_, index) => (
            <Icon key={index} as="FontAwesome" name="star" size={14} color="gold" style={styles.star} />
          ))}
        </View>
      </View>
      <View style={styles.rowContainer}>
        <Text fontFamily="EuclidCircularA-SemiBold" style={styles.text}>
          {t('credential.issuedCredentials')}
        </Text>
        <Text style={styles.text}>{t('credential.unknown')}</Text>
      </View>
      <View style={styles.rowContainer}>
        <Text fontFamily="EuclidCircularA-SemiBold" style={styles.text}>
          {t('credential.verifiedCredentials')}
        </Text>
        <Text style={styles.text}>{t('credential.unknown')}</Text>
      </View>
      <View style={styles.rowContainer}>
        <Text fontFamily="EuclidCircularA-SemiBold" style={styles.text}>
          {t('invitation.ageRestrictions')}
        </Text>
        <Text style={styles.text}>{`${minimumAgeRequired}+`}</Text>
      </View>
      <Text style={[styles.text, styles.descriptionText]}>{description}</Text>
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
      {state.connectionExists ? (
        <>
          <Text fontFamily="EuclidCircularA-Medium" style={[styles.text, styles.alreadyConnectedText]}>
            {state.isJustConnected
              ? t('connection.youAreNowConnectedTo', { name: service.name })
              : t('connection.youAreAlreadyConnectedTo', { name: service.name })}
          </Text>
          <MainButton
            text={t('connection.goToConnection')}
            style={styles.button}
            onPress={() => goToConnectionDetails(connectionRef.current!.id)}
          />
        </>
      ) : state.isConnecting ? (
        <ActivityIndicator color={theme.colors.green} size="large" />
      ) : (
        <MainButton text={t('connection.connect')} style={styles.button} onPress={connectToService} />
      )}
    </View>
  )
}

export default CredentialIssuer
