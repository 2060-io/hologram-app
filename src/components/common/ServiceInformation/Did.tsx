import { Skeleton } from 'moti/skeleton'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, TouchableOpacity } from 'react-native'

import Text from '@2060/components/common/Text'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { ServiceStatus } from '@2060/model'
import { AppTheme } from '@2060/styles'

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

const Did = ({ did, serviceInfoStatus }: { did?: string; serviceInfoStatus: ServiceStatus }) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const initialDid = did && did.length > DID_MAX_DISPLAY_CHARS ? truncateDid(did) : did
  const [truncated, setTruncated] = useState<boolean>(did ? did.length > DID_MAX_DISPLAY_CHARS : false)

  const serviceIs: Record<ServiceStatus, string> = {
    verified: t('invitation.isATrustedService'),
    'verified-test': t('invitation.notTrustedService'),
    'not-trusted': t('invitation.notTrustedService'),
    invalid: t('invitation.notFoundService'),
  }

  const onPressDid = () => setTruncated(!truncated)

  return (
    <Skeleton
      height={styles.text.fontSize * 3 + 6}
      width={'100%'}
      colorMode={theme.isDarkMode ? 'dark' : 'light'}
      radius="round"
      show={!did}
    >
      <TouchableOpacity
        onPress={onPressDid}
        activeOpacity={0}
        disabled={Number(did?.length) <= DID_MAX_DISPLAY_CHARS}
      >
        <Text style={styles.text}>
          <Text
            fontFamily="EuclidCircularA-Bold"
            style={styles.text}
          >{`${truncated ? initialDid : did} `}</Text>
          {serviceIs[serviceInfoStatus]}
        </Text>
      </TouchableOpacity>
    </Skeleton>
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
