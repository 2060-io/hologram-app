import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, TouchableOpacity, View } from 'react-native'

import getStyles from './styles'
import serviceInfo from './unicIDInfo.json'

import { Avatar, Icon, MainButton, SvgIcon, Text, VerifiedIcon } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { ServiceStatus } from '@2060/services/api'
import { getFlagEmoji, trimText } from '@2060/utils'
import { toast } from '@2060/utils/toast'

const CredentialIssuer = ({ connect }: { connect: (issuerId: string) => void }) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const {
    logoUrl,
    name,
    description,
    did,
    status,
    dataPrivacyUrl,
    termsAndConditionsUrl,
    minimumAgeRequired,
    stars,
  } = serviceInfo

  const tryToOpenURL = useCallback(async (url: string) => {
    const supported = await Linking.canOpenURL(url)
    if (supported) {
      await Linking.openURL(url)
    } else {
      toast({ type: 'error', message: `${t('general.canNotOpenURL')} ${url}` })
    }
  }, [])

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
          {Array.from({ length: stars }).map((_, index) => (
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
      <MainButton
        text={t('connection.connect')}
        style={styles.connectButton}
        onPress={() => connect(serviceInfo.id)}
      />
    </View>
  )
}

export default CredentialIssuer
