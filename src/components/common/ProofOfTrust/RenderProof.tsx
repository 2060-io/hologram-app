/* eslint-disable react/no-unstable-nested-components */
import React, { memo } from 'react'
import { View } from 'react-native'

import Text from '../Text'
import VerifiedIcon from '../VerifiedIcon'

import getStyles from './styles'

import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { ServiceInfo, ServiceProvider, ServiceStatus, BaseEntity } from '@2060/model'
import { getFlagEmoji } from '@2060/utils'

export interface ServiceInfoForRenderProof extends ServiceInfo {
  serviceProvider: ServiceProvider
}

type RenderProofProps = {
  serviceInfo: ServiceInfoForRenderProof
}

type OuterProofProps = {
  name: string
  status: ServiceStatus
}

const RenderProof = ({ serviceInfo }: RenderProofProps) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const serviceProvider = serviceInfo?.serviceProvider
  const certificationEntity = serviceProvider?.certificationEntity
  const trustRegistry = certificationEntity?.trustRegistry

  const Separator = () => (
    <Text typography="EuclidCircularA-Bold" style={styles.separator}>
      |
    </Text>
  )

  const Outer = ({ name, status }: OuterProofProps) => (
    <View style={styles.proofItemContainer}>
      <View style={styles.proofItemSubContainer}>
        <Text style={styles.entityName}>{name}</Text>
        <VerifiedIcon status={status} />
      </View>
    </View>
  )

  const Inner = ({ countryCode, entityName, officialPublicRegistryNumber, status }: BaseEntity) => {
    return (
      <View style={styles.proofItemContainer}>
        <View style={styles.proofItemSubContainer}>
          <Text style={styles.flagEmoji}>{getFlagEmoji(countryCode)}</Text>
          <Text style={styles.entityName}>{entityName}</Text>
          <VerifiedIcon status={status} />
        </View>
        <Text style={styles.entityName}>{officialPublicRegistryNumber}</Text>
      </View>
    )
  }

  return (
    <>
      <Outer name={trustRegistry?.name} status={trustRegistry?.status} />
      <Separator />
      <Inner
        countryCode={certificationEntity?.countryCode}
        entityName={certificationEntity?.entityName}
        officialPublicRegistryNumber={certificationEntity?.officialPublicRegistryNumber}
        status={certificationEntity?.status}
      />
      <Separator />
      <Inner
        countryCode={serviceProvider?.countryCode}
        entityName={serviceProvider?.entityName}
        officialPublicRegistryNumber={serviceProvider?.officialPublicRegistryNumber}
        status={serviceProvider?.status}
      />
      <Separator />
      <Outer name={serviceInfo?.name} status={serviceInfo?.status} />
    </>
  )
}

export default memo(RenderProof)
