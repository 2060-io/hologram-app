import { Skeleton } from 'moti/skeleton'
import React, { memo, useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View, Linking, TouchableOpacity, ViewStyle } from 'react-native'

import FullScreenImage from '../FullScreenImage'

import Did from './Did'
import getStyles from './styles'

import Avatar from '@src/components/common/Avatar'
import SvgIcon from '@src/components/common/SvgIcon'
import Text from '@src/components/common/Text'
import VerifiedIcon from '@src/components/common/VerifiedIcon'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { useValidateKidAgeRestrictions } from '@src/hooks/useValidateKidAgeRestrictions'
import { ServiceInfo } from '@src/model'
import { getFlagEmoji } from '@src/utils'
import { widthPercentageToDP } from '@src/utils/responsiveUtils'
import { toast } from '@src/utils/toast'

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
    return isFetchingInfo ? (
      <Skeleton
        height={widthPercentageToDP('25%')}
        width={widthPercentageToDP('25%')}
        colorMode={theme.isDarkMode ? 'dark' : 'light'}
        radius="round"
        show={isFetchingInfo}
      />
    ) : (
      <Avatar
        uri={serviceInfo?.logoUrl}
        label={serviceInfo?.name}
        size="25%"
        onImagePressed={onAvatarImagePressed}
      />
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
      {isFetchingInfo ? (
        <Skeleton width={'100%'} colorMode={theme.isDarkMode ? 'dark' : 'light'} radius="round" show />
      ) : (
        <Text style={styles.text}>{serviceInfo.description}</Text>
      )}
      <View style={styles.containerIconValidity}>
        {isFetchingInfo ? (
          <Skeleton
            height={styles.iconValidity.height}
            width={styles.iconValidity.width}
            colorMode={theme.isDarkMode ? 'dark' : 'light'}
            radius="round"
            show
          />
        ) : (
          <VerifiedIcon style={styles.iconValidity} status={serviceInfo.status} />
        )}
      </View>
      <Did did={serviceInfo.did} serviceInfoStatus={serviceInfo.status} isFetchingInfo={isFetchingInfo} />
      {failedFetchInfo && <Text style={styles.failedToFetchInfoText}>{t('credential.failedFetchInfo')}</Text>}
      {!isFetchingInfo && serviceProvider && (
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
