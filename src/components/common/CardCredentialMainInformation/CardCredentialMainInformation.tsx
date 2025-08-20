import { TrustResolutionOutcome } from '@verana-labs/verre'
import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { View, Image, StyleProp, ViewStyle, TouchableOpacity } from 'react-native'
import { SvgUri } from 'react-native-svg'

import Text from '../Text'
import VerifiedIcon from '../VerifiedIcon'

import getStyles from './styles'

import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { useFetchServiceInfo } from '@2060/hooks/useFetchServiceInfo'
import { CredentialMainInfo } from '@2060/services/agent/display'

type Props = {
  credentialMainInfo: CredentialMainInfo
  containerStyle?: StyleProp<ViewStyle>
  onPress?: () => void
  size?: 'big' | 'medium'
}

const CardCredentialMainInformation = ({
  credentialMainInfo,
  containerStyle = {},
  onPress,
  size = 'big',
}: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme, size)
  const { serviceInfo } = useFetchServiceInfo(credentialMainInfo.issuer.id)
  const uri = serviceInfo?.logoUrl ?? credentialMainInfo.issuer.logoUrl

  return (
    <TouchableOpacity style={[styles.container, containerStyle]} activeOpacity={1} onPress={onPress}>
      <View style={styles.subContainer}>
        <View style={styles.imageContainer}>
          {uri?.endsWith('.svg') ? (
            <SvgUri uri={uri} width={styles.image.width} height={styles.image.height} />
          ) : (
            <Image style={styles.image} resizeMode="contain" source={{ uri }} />
          )}
        </View>
        <Text style={styles.name} typography="EuclidCircularA-Medium">
          {credentialMainInfo.schemaName}
        </Text>
      </View>
      <View>
        <Text style={styles.issuedOn} typography="EuclidCircularA-Regular">
          {`${credentialMainInfo.dateLabel ?? t('credential.issuedOn')}: ${credentialMainInfo.createdAt}`}
        </Text>
        <View style={styles.bottomContainer}>
          <Text style={styles.bottomText} typography="EuclidCircularA-Medium" numberOfLines={1}>
            {serviceInfo?.name ?? credentialMainInfo.issuer.name}
          </Text>
          <VerifiedIcon status={serviceInfo?.status ?? TrustResolutionOutcome.INVALID} />
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default memo(CardCredentialMainInformation)
