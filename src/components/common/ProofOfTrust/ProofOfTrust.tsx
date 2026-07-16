import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { ServiceInfo } from '@src/model'
import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import Text from '../Text'
import ProofOfTrustLoadingSkeleton from './ProofOfTrustLoadingSkeleton'
import RenderProof, { ServiceInfoForRenderProof } from './RenderProof'
import getStyles from './styles'

type Props = {
  serviceInfo: ServiceInfo | undefined
  isFetchingInfo: boolean
  failedFetchInfo: boolean
}

const ProofOfTrust = ({ serviceInfo, isFetchingInfo, failedFetchInfo }: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)

  if (failedFetchInfo) return null
  if (!isFetchingInfo && !serviceInfo?.serviceProvider) return null
  return (
    <View style={styles.container}>
      <Text fontFamily="EuclidCircularA-Bold" style={styles.title}>
        {t('connection.proofOfTrust')}
      </Text>
      {isFetchingInfo ? (
        <ProofOfTrustLoadingSkeleton />
      ) : (
        serviceInfo?.serviceProvider && <RenderProof serviceInfo={serviceInfo as ServiceInfoForRenderProof} />
      )}
    </View>
  )
}

export default memo(ProofOfTrust)
