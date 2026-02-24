import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity } from 'react-native'

import getStyles from './styles'

import Text from '@src/components/common/Text'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { ServiceStatus } from '@src/model'

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
}

const Did = ({ did, serviceInfoStatus }: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const initialDid = did.length > DID_MAX_DISPLAY_CHARS ? truncateDid(did) : did
  const [truncated, setTruncated] = useState<boolean>(did.length > DID_MAX_DISPLAY_CHARS)

  const serviceIs: Record<ServiceStatus, string> = {
    verified: t('invitation.isATrustedService'),
    'verified-test': t('invitation.notTrustedService'),
    'not-trusted': t('invitation.notTrustedService'),
    invalid: t('invitation.notFoundService'),
  }

  const onPressDid = () => setTruncated(!truncated)

  return (
    <TouchableOpacity onPress={onPressDid} activeOpacity={0} disabled={did.length <= DID_MAX_DISPLAY_CHARS}>
      <Text style={styles.text}>
        <Text
          fontFamily="EuclidCircularA-Bold"
          style={styles.text}
        >{`${truncated ? initialDid : did} `}</Text>
        {serviceIs[serviceInfoStatus]}
      </Text>
    </TouchableOpacity>
  )
}

export default Did
