import React, { memo, useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View, Linking, TouchableOpacity } from 'react-native'

import FullScreenImage from '../FullScreenImage'

import getStyles from './styles'

import Avatar from '@2060/components/common/Avatar'
import SvgIcon from '@2060/components/common/SvgIcon'
import Text from '@2060/components/common/Text'
import VerifiedIcon from '@2060/components/common/VerifiedIcon'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { ServiceInfo, ServiceStatus } from '@2060/services/api/trustRegistryService'
import { getFlagEmoji, trimText } from '@2060/utils'
import { toast } from '@2060/utils/toast'

type Props = {
  serviceInfo: ServiceInfo
}

const ServiceMainInfo = ({ serviceInfo }: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { serviceProvider, dataPrivacyUrl, termsAndConditionsUrl, minimumAgeRequired } = serviceInfo
  const [showFullScreenImage, setShowFullScreenImage] = useState<boolean>(false)
  const imageFullScreenUri = useRef<string | undefined>(undefined)

  const onAvatarImagePressed = (avatarImageUri: string) => {
    setShowFullScreenImage(true)
    imageFullScreenUri.current = avatarImageUri
  }
  const closeFullScreenImage = () => setShowFullScreenImage(false)

  const tryToOpenURL = useCallback(async (url: string) => {
    const supported = await Linking.canOpenURL(url)
    if (supported) {
      await Linking.openURL(url)
    } else {
      toast({ type: 'error', message: `${t('general.canNotOpenURL')} ${url}` })
    }
  }, [])

  const serviceIs: Record<ServiceStatus, string> = {
    trusted: t('invitation.isATrustedService'),
    notTrusted: t('invitation.notTrustedService'),
    notFound: t('invitation.notFoundService'),
  }

  return (
    <View style={styles.containerCardIssuerInfo}>
      <FullScreenImage
        showFullScreenImage={showFullScreenImage}
        closeFullScreenImage={closeFullScreenImage}
        imageUri={imageFullScreenUri.current!}
      />
      <Avatar
        uri={serviceInfo.logoUrl}
        label={serviceInfo.name}
        size="25%"
        onImagePressed={onAvatarImagePressed}
      />
      <Text typography="EuclidCircularA-Medium" style={styles.issuerName}>
        {serviceInfo.name}
      </Text>
      {serviceInfo.description && (
        <Text typography="EuclidCircularA-Regular" style={[styles.text]}>
          {serviceInfo.description}
        </Text>
      )}
      <VerifiedIcon style={styles.containerIconValidity} status={serviceInfo.status} />
      <Text typography="EuclidCircularA-Regular" style={styles.text}>
        <Text typography="EuclidCircularA-Bold" style={styles.text}>
          {trimText(serviceInfo.did ?? '')}
        </Text>{' '}
        {serviceIs[serviceInfo.status]}
      </Text>
      {serviceProvider && (
        <View style={styles.serviceProviderInfoContainer}>
          <Text typography="EuclidCircularA-Regular" style={styles.text}>
            {t('invitation.serviceProvider')}
          </Text>
          <View style={styles.serviceProviderName}>
            <Text style={styles.flagEmoji}>{getFlagEmoji(serviceProvider.countryCode)}</Text>
            <Text typography="EuclidCircularA-Regular" style={styles.text}>
              {serviceProvider.entityName}
            </Text>
          </View>
          <Text typography="EuclidCircularA-Regular" style={styles.text}>
            {serviceProvider.officialPublicRegistryNumber}
          </Text>
          {termsAndConditionsUrl && (
            <TouchableOpacity
              style={styles.termsAndConditionsContainer}
              onPress={() => tryToOpenURL(termsAndConditionsUrl)}
            >
              <Text typography="EuclidCircularA-Regular" style={[styles.text, styles.underLineText]}>
                {t('invitation.termsAndConditions')}
              </Text>
              <SvgIcon name="arrowUpRightFromSquare" fill={theme.colors.primaryText} width={15} height={15} />
            </TouchableOpacity>
          )}
          {dataPrivacyUrl && (
            <TouchableOpacity
              style={styles.privacyPolicyContainer}
              onPress={() => tryToOpenURL(dataPrivacyUrl)}
            >
              <Text style={[styles.text, styles.underLineText]}>{t('invitation.privacyPolicy')}</Text>
              <SvgIcon name="arrowUpRightFromSquare" fill={theme.colors.primaryText} width={15} height={15} />
            </TouchableOpacity>
          )}
          {minimumAgeRequired && (
            <Text typography="EuclidCircularA-Regular" style={styles.text}>
              {`${t('invitation.ageRestrictions')} ${minimumAgeRequired}+`}
            </Text>
          )}
        </View>
      )}
    </View>
  )
}

export default memo(ServiceMainInfo)
