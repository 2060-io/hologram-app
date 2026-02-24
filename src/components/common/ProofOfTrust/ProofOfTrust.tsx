import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import Text from '../Text'

import ProofOfTrustLoadingSkeleton from './ProofOfTrustLoadingSkeleton'
import RenderProof, { ServiceInfoForRenderProof } from './RenderProof'
import getStyles from './styles'

import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { ServiceInfo } from '@src/model'

type Props = {
  serviceInfo: ServiceInfo | undefined
  isFetchingInfo: boolean
}

const ProofOfTrust = ({ serviceInfo, isFetchingInfo }: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const displayLoadingSkeleton = isFetchingInfo && !serviceInfo?.serviceProvider

  if (!isFetchingInfo && !serviceInfo?.serviceProvider) return null
  return (
    <View style={styles.container}>
      <Text fontFamily="EuclidCircularA-Bold" style={styles.title}>
        {t('connection.proofOfTrust')}
      </Text>
      {displayLoadingSkeleton ? (
        <ProofOfTrustLoadingSkeleton />
      ) : (
        serviceInfo?.serviceProvider && <RenderProof serviceInfo={serviceInfo as ServiceInfoForRenderProof} />
      )}
    </View>
  )
}

export default memo(ProofOfTrust)
