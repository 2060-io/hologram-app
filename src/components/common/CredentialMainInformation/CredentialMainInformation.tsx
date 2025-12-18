import { TrustResolutionOutcome } from '@verana-labs/verre'
import { Skeleton } from 'moti/skeleton'
import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { View, Image, StyleProp, ViewStyle, TouchableOpacity } from 'react-native'
import { uses24HourClock } from 'react-native-localize'
import { SvgUri } from 'react-native-svg'

import Text from '../Text'
import VerifiedIcon from '../VerifiedIcon'

import getStyles from './styles'

import imagePlaceholder from '@2060/assets/images/placeholderImg.png'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { useFetchServiceInfo } from '@2060/hooks/useFetchServiceInfo'
import { CredentialMainInfo } from '@2060/services/agent/display'
import { dateToString } from '@2060/utils/dateUtils'

type Props = {
  credentialMainInfo: CredentialMainInfo | null
  containerStyle?: StyleProp<ViewStyle>
  onPress?: () => void
  size?: 'big' | 'medium'
}

const CredentialMainInformation = ({ credentialMainInfo, containerStyle, onPress, size = 'big' }: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme, size)
  const { serviceInfo } = useFetchServiceInfo(credentialMainInfo?.issuer.id)
  const using24HourFormat = uses24HourClock()
  const uri = serviceInfo?.logoUrl ?? credentialMainInfo?.issuer.logoUrl
  const issuedDate = credentialMainInfo?.createdAt
    ? dateToString(credentialMainInfo.createdAt, `DD-MM-YYYY ${using24HourFormat ? 'HH:mm' : 'h:mm A'}`)
    : null
  const issuedOn = issuedDate ? `${t('credential.issuedOn')}: ${issuedDate}` : null
  const colorMode = theme.isDarkMode ? 'dark' : 'light'

  return (
    <Skeleton.Group show={!credentialMainInfo}>
      <TouchableOpacity style={[styles.container, containerStyle]} activeOpacity={1} onPress={onPress}>
        <View style={styles.subContainer}>
          <Skeleton
            height={styles.image.height}
            width={styles.image.width}
            colorMode={colorMode}
            radius="square"
          >
            <View style={styles.imageContainer}>
              {uri?.endsWith('.svg') ? (
                <SvgUri uri={uri} width={styles.image.width} height={styles.image.height} />
              ) : (
                <Image
                  style={styles.image}
                  resizeMode="contain"
                  source={uri?.length ? { uri } : imagePlaceholder}
                />
              )}
            </View>
          </Skeleton>
          <View style={styles.nameContainer}>
            <Skeleton height={styles.name.fontSize + 2} width="50%" colorMode={colorMode} radius="round">
              <Text style={styles.name} fontFamily="EuclidCircularA-Medium">
                {credentialMainInfo?.schemaName}
              </Text>
            </Skeleton>
          </View>
        </View>
        <View>
          <View style={styles.issuedOnContainer}>
            <Skeleton width="40%" height={15} colorMode={colorMode} radius="round">
              {issuedOn ? <Text style={styles.issuedOn}>{issuedOn}</Text> : null}
            </Skeleton>
          </View>
          <Skeleton width="100%" height={20} colorMode={colorMode} radius="round">
            <View style={styles.bottomContainer}>
              <Text style={styles.bottomText} fontFamily="EuclidCircularA-Medium" numberOfLines={1}>
                {serviceInfo?.name ?? credentialMainInfo?.issuer.name}
              </Text>
              <VerifiedIcon status={serviceInfo?.status ?? TrustResolutionOutcome.INVALID} />
            </View>
          </Skeleton>
        </View>
      </TouchableOpacity>
    </Skeleton.Group>
  )
}

export default memo(CredentialMainInformation)
