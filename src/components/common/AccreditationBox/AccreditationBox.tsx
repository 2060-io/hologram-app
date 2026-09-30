import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { ServiceStatus } from '@src/model'
import type { Accreditation, AccreditationRole } from '@src/services/verana/accreditation'
import { Skeleton } from 'moti/skeleton'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity, View } from 'react-native'
import Text from '../Text'
import VerifiedIcon from '../VerifiedIcon'
import getStyles from './styles'

type Props = {
  party: AccreditationRole
  serviceName: string
  accreditation?: Accreditation
  isChecking: boolean
  onRetry: () => void
}

const ICON_STATUS = {
  authorized: ServiceStatus.Trusted,
  unauthorized: ServiceStatus.Untrusted,
  unverified: ServiceStatus.Unverified,
} as const

const AccreditationBox = ({ party, serviceName, accreditation, isChecking, onRetry }: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const schema = accreditation?.schemaTitles.join(', ') || t('accreditation.thisCredential')
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
    <View style={styles.container} testID="accreditation-box">
      <Text fontFamily="EuclidCircularA-Medium" style={styles.title}>
        {t(party === 'ISSUER' ? 'accreditation.offersYou' : 'accreditation.requests')}
      </Text>
      {isChecking || !accreditation ? (
        <Skeleton width="100%" colorMode={theme.isDarkMode ? 'dark' : 'light'} radius="round" show />
      ) : (
        <>
          <Text fontFamily="EuclidCircularA-Bold" style={styles.schema}>
            {schema}
          </Text>
          <View style={styles.verdict}>
            <VerifiedIcon style={styles.icon} status={ICON_STATUS[accreditation.status]} />
            <Text style={styles.text} testID={`accreditation-${accreditation.status}`}>
              {verdicts[party][accreditation.status]}
            </Text>
          </View>
          {accreditation.status === 'unverified' && (
            <TouchableOpacity onPress={onRetry} testID="accreditation-retry">
              <Text style={[styles.text, styles.retry]}>{t('tryAgain')}</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  )
}

export default AccreditationBox
