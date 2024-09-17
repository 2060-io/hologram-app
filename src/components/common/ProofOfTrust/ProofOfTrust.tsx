import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import Text from '../Text'
import VerifiedIcon from '../VerifiedIcon'

import RenderProof, { ServiceInfoForRenderProof } from './RenderProof'
import getStyles from './styles'

import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { ServiceInfo } from '@2060/services/api/trustRegistryService'

type Props = {
  serviceInfo: ServiceInfo
}

const ProofOfTrust = ({ serviceInfo }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { t } = useTranslation()
  const { serviceProvider } = serviceInfo

  return (
    <View style={styles.container}>
      <Text typography="EuclidCircularA-Bold" style={styles.title}>
        {t('connection.proofOfTrust')}
      </Text>
      {serviceProvider ? (
        <RenderProof serviceInfo={serviceInfo as ServiceInfoForRenderProof} />
      ) : (
        <>
          <VerifiedIcon style={styles.notVerifiableIcon} status={serviceInfo.status} />
          <Text typography="EuclidCircularA-Regular" style={styles.notVerifiable}>
            {t('invitation.serviceNotVerifiable')}
          </Text>
        </>
      )}
    </View>
  )
}

export default memo(ProofOfTrust)
