import Text from '@src/components/common/Text'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { isTrustedStatus, ServiceStatus } from '@src/model'
import { TrustResolutionOutcome } from '@verana-labs/verre'
import { AppTheme } from '@src/styles'
import { Skeleton } from 'moti/skeleton'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, TouchableOpacity } from 'react-native'

const DID_MAX_DISPLAY_CHARS = 50

const truncateDid = (fullDid: string) => {
  const didParts = fullDid.split(':')
  if (didParts.length < 4) return fullDid
  const [did, method, hash, domain] = didParts
  // Calculate remaining space for hash after accounting for "did:method:...domain"
  const fixedParts = `${did}:${method}:...${domain}`
  const remainingChars = DID_MAX_DISPLAY_CHARS - fixedParts.length
  const truncatedHash = hash.substring(0, remainingChars)
  return `${did}:${method}:${truncatedHash}...${domain}`
}

type Props = {
  did: string
  serviceInfoStatus: ServiceStatus
  isFetchingInfo: boolean
}

const Did = ({ did, serviceInfoStatus, isFetchingInfo }: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const safeDid = did ?? ''
  const initialDid = safeDid.length > DID_MAX_DISPLAY_CHARS ? truncateDid(safeDid) : safeDid
  const [truncated, setTruncated] = useState<boolean>(safeDid.length > DID_MAX_DISPLAY_CHARS)

  const serviceIs: Record<ServiceStatus, string> = {
    verified: t('invitation.isATrustedService'),
    'verified-test': isTrustedStatus(TrustResolutionOutcome.VERIFIED_TEST)
      ? t('invitation.isATrustedService')
      : t('invitation.notTrustedService'),
    'not-trusted': t('invitation.notTrustedService'),
    invalid: t('invitation.notFoundService'),
    unverified: t('invitation.notVerifiedYetService'),
  }

  const onPressDid = () => setTruncated(!truncated)

  return isFetchingInfo ? (
    <Skeleton
      height={styles.text.fontSize * 3 + 6}
      width={'100%'}
      colorMode={theme.isDarkMode ? 'dark' : 'light'}
      radius="round"
      show={isFetchingInfo}
    />
  ) : (
    <TouchableOpacity onPress={onPressDid} activeOpacity={0} disabled={safeDid.length <= DID_MAX_DISPLAY_CHARS}>
      <Text style={styles.text}>
        <Text fontFamily="EuclidCircularA-Bold" style={styles.text}>{`${truncated ? initialDid : safeDid} `}</Text>
        {serviceIs[serviceInfoStatus]}
      </Text>
    </TouchableOpacity>
  )
}

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    text: {
      fontSize: theme.fontSize.md,
      color: theme.colors.primaryText,
      textAlign: 'center',
    },
  })

export default Did
