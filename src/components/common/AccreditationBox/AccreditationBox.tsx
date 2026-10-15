import type { Accreditation, AccreditationRole } from '@src/services/verana/accreditation'
import { Skeleton } from 'moti/skeleton'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity, View } from 'react-native'
import { CheckIcon, CrossIcon, InfoIcon } from '../ProofOfTrustCard/parts'
import { useVeranaCard } from '../ProofOfTrustCard/useVeranaCard'
import Text from '../Text'
import getStyles from './styles'

type Props = {
  party: AccreditationRole
  serviceName: string
  accreditation?: Accreditation
  onRetry: () => void
  fallbackSchemaTitle?: string
}

const AccreditationBox = ({ party, serviceName, accreditation, onRetry, fallbackSchemaTitle }: Props) => {
  const { t } = useTranslation()
  const { colors, isDarkMode } = useVeranaCard()
  const styles = useMemo(() => getStyles(colors), [colors])
  const iconColor = {
    authorized: colors.ok,
    unauthorized: colors.bad,
    unverified: colors.faint,
  }
  const boxColors = {
    authorized: { backgroundColor: colors.okSoft, borderColor: colors.okRail },
    unauthorized: { backgroundColor: colors.badSoft, borderColor: colors.badRail },
    unverified: { backgroundColor: colors.neutralSoft, borderColor: colors.noneRail },
  }
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
    <View style={[styles.container, boxColors[accreditation?.status ?? 'unverified']]}>
      <Text fontFamily="EuclidCircularA-Medium" style={styles.title}>
        {t(party === 'ISSUER' ? 'accreditation.offersYou' : 'accreditation.requests')}
      </Text>
      {!accreditation ? (
        <Skeleton width="100%" colorMode={isDarkMode ? 'dark' : 'light'} radius="round" show />
      ) : (
        <>
          <Text fontFamily="EuclidCircularA-Bold" style={styles.schema}>
            {schema}
          </Text>
          <View style={styles.verdict}>
            <View style={styles.icon}>
              {accreditation.status === 'authorized' ? (
                <CheckIcon color={iconColor.authorized} />
              ) : accreditation.status === 'unauthorized' ? (
                <CrossIcon color={iconColor.unauthorized} />
              ) : (
                <InfoIcon color={iconColor.unverified} />
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
