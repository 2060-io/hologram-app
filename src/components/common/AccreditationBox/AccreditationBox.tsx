import type { Accreditation, AccreditationRole } from '@src/services/verana/accreditation'
import { Skeleton } from 'moti/skeleton'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity, View } from 'react-native'
import { CheckIcon, CrossIcon, InfoIcon } from '../ProofOfTrustCard/parts'
import { veranaCardColors } from '../ProofOfTrustCard/styles'
import Text from '../Text'
import styles from './styles'

type Props = {
  party: AccreditationRole
  serviceName: string
  accreditation?: Accreditation
  onRetry: () => void
  fallbackSchemaTitle?: string
}

const ICON_COLOR = {
  authorized: veranaCardColors.ok,
  unauthorized: veranaCardColors.bad,
  unverified: veranaCardColors.faint,
} as const

const BOX_COLORS = {
  authorized: { backgroundColor: veranaCardColors.okSoft, borderColor: veranaCardColors.okRail },
  unauthorized: { backgroundColor: veranaCardColors.badSoft, borderColor: veranaCardColors.badRail },
  unverified: { backgroundColor: veranaCardColors.neutralSoft, borderColor: veranaCardColors.noneRail },
} as const

const AccreditationBox = ({ party, serviceName, accreditation, onRetry, fallbackSchemaTitle }: Props) => {
  const { t } = useTranslation()
  const schema = accreditation?.schemaTitles.join(', ') || fallbackSchemaTitle || t('accreditation.thisCredential')
  const verdicts = {
    ISSUER: {
      authorized: t('accreditation.authorizedIssuer', { service: serviceName, schema }),
      unauthorized: t('accreditation.unauthorizedIssuer', { service: serviceName, schema }),
      unverified: t('accreditation.couldNotVerifyIssuer', { service: serviceName }),
    },
    VERIFIER: {
      authorized: t('accreditation.authorizedVerifier', { service: serviceName, schema }),
      unauthorized: t('accreditation.unauthorizedVerifier', { service: serviceName, schema }),
      unverified: t('accreditation.couldNotVerifyVerifier', { service: serviceName }),
    },
  }

  return (
    <View style={[styles.container, BOX_COLORS[accreditation?.status ?? 'unverified']]}>
      <Text fontFamily="EuclidCircularA-Medium" style={styles.title}>
        {t(party === 'ISSUER' ? 'accreditation.offersYou' : 'accreditation.requests')}
      </Text>
      {!accreditation ? (
        <Skeleton width="100%" colorMode="light" radius="round" show />
      ) : (
        <>
          <Text fontFamily="EuclidCircularA-Bold" style={styles.schema}>
            {schema}
          </Text>
          <View style={styles.verdict}>
            <View style={styles.icon}>
              {accreditation.status === 'authorized' ? (
                <CheckIcon color={ICON_COLOR.authorized} />
              ) : accreditation.status === 'unauthorized' ? (
                <CrossIcon color={ICON_COLOR.unauthorized} />
              ) : (
                <InfoIcon color={ICON_COLOR.unverified} />
              )}
            </View>
            <Text style={styles.text}>{verdicts[party][accreditation.status]}</Text>
          </View>
          {accreditation.status === 'unverified' && (
            <TouchableOpacity onPress={onRetry}>
              <Text style={[styles.text, styles.retry]}>{t('tryAgain')}</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  )
}

export default AccreditationBox
