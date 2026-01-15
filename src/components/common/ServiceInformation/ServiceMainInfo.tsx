import { TrustResolutionOutcome } from '@verana-labs/verre'
import { Skeleton } from 'moti/skeleton'
import React, { memo, useCallback, useRef, useState } from 'react'
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
  serviceInfo?: ServiceInfo
  containerStyle?: ViewStyle
}

const ServiceMainInfo = ({ serviceInfo, containerStyle }: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const [showFullScreenImage, setShowFullScreenImage] = useState<boolean>(false)
  const imageFullScreenUri = useRef<string | undefined>(undefined)
  const { ageRestricted } = useValidateKidAgeRestrictions({
    minimumAgeRequired: serviceInfo?.minimumAgeRequired ?? 0,
    serviceStatus: serviceInfo?.status ?? TrustResolutionOutcome.INVALID,
  })

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

  return (
    <Skeleton.Group show={!serviceInfo}>
      <View style={[styles.containerCardIssuerInfo, containerStyle]}>
        <FullScreenImage
          showFullScreenImage={showFullScreenImage}
          closeFullScreenImage={closeFullScreenImage}
          imageUri={imageFullScreenUri.current!}
        />
        <Skeleton
          height={widthPercentageToDP('25%')}
          width={widthPercentageToDP('25%')}
          colorMode={theme.isDarkMode ? 'dark' : 'light'}
          radius="round"
        >
          <Avatar
            uri={serviceInfo?.logoUrl}
            label={serviceInfo?.name}
            size="25%"
            onImagePressed={onAvatarImagePressed}
          />
        </Skeleton>
        <View style={styles.issuerNameContainer}>
          <Skeleton
            height={styles.issuerName.fontSize + 2}
            width={'50%'}
            colorMode={theme.isDarkMode ? 'dark' : 'light'}
            radius="round"
          >
            <Text fontFamily="EuclidCircularA-Medium" style={styles.issuerName}>
              {serviceInfo?.name}
            </Text>
          </Skeleton>
        </View>
        <Skeleton
          height={styles.text.fontSize + 2}
          width={'100%'}
          colorMode={theme.isDarkMode ? 'dark' : 'light'}
          radius="round"
        >
          <Text style={styles.text}>{serviceInfo?.description}</Text>
        </Skeleton>
        <View style={styles.containerIconValidity}>
          <Skeleton
            height={styles.iconValidity.height}
            width={styles.iconValidity.width}
            colorMode={theme.isDarkMode ? 'dark' : 'light'}
            radius="round"
          >
            <VerifiedIcon
              style={styles.iconValidity}
              status={serviceInfo?.status ?? TrustResolutionOutcome.INVALID}
            />
          </Skeleton>
        </View>
        <Did
          did={serviceInfo?.did}
          serviceInfoStatus={serviceInfo?.status ?? TrustResolutionOutcome.INVALID}
        />
        {serviceInfo?.serviceProvider && (
          <View style={styles.serviceProviderInfoContainer}>
            <Text style={styles.text}>{t('invitation.serviceProvider')}</Text>
            <View style={styles.serviceProviderName}>
              <Text style={styles.flagEmoji}>{getFlagEmoji(serviceInfo.serviceProvider.countryCode)}</Text>
              <Text style={styles.text}>{serviceInfo.serviceProvider.entityName}</Text>
            </View>
            <Text style={styles.text}>{serviceInfo.serviceProvider.officialPublicRegistryNumber}</Text>
            {serviceInfo?.termsAndConditionsUrl && (
              <TouchableOpacity
                style={styles.termsAndConditionsContainer}
                onPress={() => tryToOpenURL(serviceInfo.termsAndConditionsUrl!)}
              >
                <Text style={[styles.text, styles.underLineText]}>{t('invitation.termsAndConditions')}</Text>
                <SvgIcon
                  name="arrowUpRightFromSquare"
                  fill={theme.colors.primaryText}
                  width={15}
                  height={15}
                />
              </TouchableOpacity>
            )}
            {serviceInfo?.dataPrivacyUrl && (
              <TouchableOpacity
                style={styles.privacyPolicyContainer}
                onPress={() => tryToOpenURL(serviceInfo.dataPrivacyUrl!)}
              >
                <Text style={[styles.text, styles.underLineText]}>{t('invitation.privacyPolicy')}</Text>
                <SvgIcon
                  name="arrowUpRightFromSquare"
                  fill={theme.colors.primaryText}
                  width={15}
                  height={15}
                />
              </TouchableOpacity>
            )}
            {serviceInfo.minimumAgeRequired && (
              <Text style={{ ...styles.text, ...(ageRestricted && styles.notOldEnoughTextColor) }}>
                {`${t('invitation.ageRestrictions')} ${serviceInfo.minimumAgeRequired}+`}
              </Text>
            )}
          </View>
        )}
      </View>
    </Skeleton.Group>
  )
}

export default memo(ServiceMainInfo)
