import { Skeleton } from 'moti/skeleton'
import React, { memo, useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View, Linking, TouchableOpacity, ViewStyle } from 'react-native'

import FullScreenImage from '../FullScreenImage'

import Did from './Did'
import getStyles from './styles'

import Avatar from '@2060/components/common/Avatar'
import SvgIcon from '@2060/components/common/SvgIcon'
import Text from '@2060/components/common/Text'
import VerifiedIcon from '@2060/components/common/VerifiedIcon'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { useValidateKidAgeRestrictions } from '@2060/hooks/useValidateKidAgeRestrictions'
import { ServiceInfo } from '@2060/model'
import { getFlagEmoji } from '@2060/utils'
import { widthPercentageToDP } from '@2060/utils/responsiveUtils'
import { toast } from '@2060/utils/toast'

type Props = {
  serviceInfo: ServiceInfo
  isFetchingInfo: boolean
  failedFetchInfo: boolean
  containerStyle?: ViewStyle
}

const ServiceMainInfo = ({ serviceInfo, isFetchingInfo, failedFetchInfo, containerStyle }: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { serviceProvider, dataPrivacyUrl, termsAndConditionsUrl, minimumAgeRequired, status } = serviceInfo
  const [showFullScreenImage, setShowFullScreenImage] = useState<boolean>(false)
  const imageFullScreenUri = useRef<string | undefined>(undefined)
  const { ageRestricted } = useValidateKidAgeRestrictions({ minimumAgeRequired, serviceStatus: status })

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

  const badge = useMemo(() => {
    if (failedFetchInfo) {
      return (
        <SvgIcon
          name="warning"
          width={widthPercentageToDP('25%')}
          height={widthPercentageToDP('25%')}
          fill={theme.colors.lightGrey}
        />
      )
    }
    return (
      <Skeleton
        height={widthPercentageToDP('25%')}
        width={widthPercentageToDP('25%')}
        colorMode={theme.isDarkMode ? 'dark' : 'light'}
        radius="round"
        show={isFetchingInfo}
      >
        <Avatar
          uri={serviceInfo?.logoUrl}
          label={serviceInfo?.name}
          size="25%"
          onImagePressed={onAvatarImagePressed}
        />
      </Skeleton>
    )
  }, [isFetchingInfo, failedFetchInfo, serviceInfo])

  return (
    <View style={[styles.containerCardIssuerInfo, containerStyle]}>
      <FullScreenImage
        showFullScreenImage={showFullScreenImage}
        closeFullScreenImage={closeFullScreenImage}
        imageUri={imageFullScreenUri.current!}
      />
      {badge}
      <Text fontFamily="EuclidCircularA-Medium" style={styles.issuerName}>
        {serviceInfo.name}
      </Text>
      {serviceInfo.description && <Text style={[styles.text]}>{serviceInfo.description}</Text>}
      <VerifiedIcon style={styles.containerIconValidity} status={serviceInfo.status} />
      <Did did={serviceInfo.did} serviceInfoStatus={serviceInfo.status} />
      {failedFetchInfo && <Text style={styles.failedToFetchInfoText}>{t('credential.failedFetchInfo')}</Text>}
      {serviceProvider && (
        <View style={styles.serviceProviderInfoContainer}>
          <Text style={styles.text}>{t('invitation.serviceProvider')}</Text>
          <View style={styles.serviceProviderName}>
            <Text style={styles.flagEmoji}>{getFlagEmoji(serviceProvider.countryCode)}</Text>
            <Text style={styles.text}>{serviceProvider.entityName}</Text>
          </View>
          <Text style={styles.text}>{serviceProvider.officialPublicRegistryNumber}</Text>
          {termsAndConditionsUrl && (
            <TouchableOpacity
              style={styles.termsAndConditionsContainer}
              onPress={() => tryToOpenURL(termsAndConditionsUrl)}
            >
              <Text style={[styles.text, styles.underLineText]}>{t('invitation.termsAndConditions')}</Text>
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
            <Text style={{ ...styles.text, ...(ageRestricted && styles.notOldEnoughTextColor) }}>
              {`${t('invitation.ageRestrictions')} ${minimumAgeRequired}+`}
            </Text>
          )}
        </View>
      )}
    </View>
  )
}

export default memo(ServiceMainInfo)
