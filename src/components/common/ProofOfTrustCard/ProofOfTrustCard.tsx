import { ServiceInfo, ServiceStatus } from '@src/model'
import { getFlagEmoji } from '@src/utils'
import React, { memo, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, TouchableOpacity, View } from 'react-native'
import Text from '../Text'
import { ArrowUpRightIcon, LockIcon, RegistryChip, SectionLabel, StepTick, StepTone, VeranaMark } from './parts'
import styles, { veranaCardColors } from './styles'

type Props = {
  serviceInfo: ServiceInfo
  isFetchingInfo: boolean
  failedFetchInfo?: boolean
  onRetry?: () => void
  ask?: ReactNode
}

const OPERATOR_SCHEMAS = ['OrganizationCredential', 'PersonaCredential']

const stringOf = (value: unknown) => (typeof value === 'string' && value ? value : undefined)

const isHttpUri = (uri?: string): uri is string => typeof uri === 'string' && /^https?:\/\//i.test(uri)

const ProofOfTrustCard = ({ serviceInfo, isFetchingInfo, failedFetchInfo, onRetry, ask }: Props) => {
  const { t } = useTranslation()
  const status = isFetchingInfo
    ? ServiceStatus.Resolving
    : failedFetchInfo
      ? ServiceStatus.Unverified
      : serviceInfo.status
  const isTrusted = status === ServiceStatus.Trusted
  const tone = {
    [ServiceStatus.Trusted]: { color: veranaCardColors.ok, label: t('proofOfTrust.statusTrusted') },
    [ServiceStatus.Untrusted]: { color: veranaCardColors.bad, label: t('proofOfTrust.statusUntrusted') },
    [ServiceStatus.Unverified]: { color: veranaCardColors.faint, label: t('proofOfTrust.statusUnverified') },
    [ServiceStatus.Resolving]: { color: veranaCardColors.faint, label: t('proofOfTrust.statusResolving') },
  }[status]
  const claimTone: StepTone =
    status === ServiceStatus.Untrusted ? 'bad' : status === ServiceStatus.Trusted ? 'ok' : 'none'

  const service = isTrusted
    ? serviceInfo.ecsCredentials?.find((credential) => credential.ecsSchema === 'ServiceCredential')?.credentialSubject
    : undefined
  const serviceName = stringOf(service?.name)
  const serviceDescription = stringOf(service?.description)
  const operator = isTrusted
    ? serviceInfo.ecsCredentials?.find((credential) => OPERATOR_SCHEMAS.includes(credential.ecsSchema))
        ?.credentialSubject
    : undefined
  const operatorName = stringOf(operator?.name)
  const operatorCountry = stringOf(operator?.countryCode)
  const otherCredentials = isTrusted
    ? (serviceInfo.presentations ?? []).flatMap((presentation) => presentation.vtcCredentials ?? [])
    : []
  const failedCredentialIds =
    status === ServiceStatus.Untrusted
      ? (serviceInfo.presentations ?? []).flatMap((presentation) => [
          ...(presentation.unresolvableCredentialIds ?? []),
          ...(presentation.invalidCredentialIds ?? []),
        ])
      : []
  const minimumAgeRequired = serviceInfo.minimumAgeRequired ?? 0
  const hasConditions =
    isTrusted &&
    (minimumAgeRequired > 0 || isHttpUri(serviceInfo.termsAndConditionsUrl) || isHttpUri(serviceInfo.dataPrivacyUrl))

  const notCheckedText =
    status === ServiceStatus.Resolving ? t('proofOfTrust.statusResolving') : t('proofOfTrust.notChecked')

  return (
    <View style={styles.card}>
      <View style={styles.didRow}>
        <View style={[styles.didDot, { backgroundColor: tone.color }]} />
        <Text style={styles.didText} numberOfLines={1} ellipsizeMode="middle">
          {serviceInfo.did}
        </Text>
        {serviceInfo.network && !serviceInfo.network.production && (
          <View style={styles.testnetChip}>
            <Text style={styles.testnetChipText}>{serviceInfo.network.label}</Text>
          </View>
        )}
        <VeranaMark />
      </View>
      <View style={styles.verdictStack}>
        <View style={[styles.verdictPill, { borderColor: tone.color }]}>
          <VeranaMark size={14} />
          <Text fontFamily="EuclidCircularA-Medium" style={[styles.verdictPillLabel, { color: tone.color }]}>
            {tone.label}
          </Text>
        </View>
        {serviceInfo.evaluatedAtTime && status !== ServiceStatus.Resolving && (
          <Text style={[styles.verdictNote, { color: veranaCardColors.sub }]}>
            {t('proofOfTrust.evaluatedAt', { date: new Date(serviceInfo.evaluatedAtTime).toLocaleString() })}
          </Text>
        )}
        {status === ServiceStatus.Unverified && onRetry && (
          <TouchableOpacity onPress={onRetry}>
            <Text style={[styles.verdictNote, styles.conditionLink]}>{t('tryAgain')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <SectionLabel>{t('proofOfTrust.sectionService')}</SectionLabel>
        <View style={styles.identityRow}>
          <View style={styles.identityBody}>
            <Text style={styles.identityName} numberOfLines={2}>
              {isTrusted
                ? serviceName || t('proofOfTrust.noServiceCredential')
                : status === ServiceStatus.Untrusted
                  ? t('proofOfTrust.serviceClaimsNotVerified')
                  : notCheckedText}
            </Text>
            {serviceDescription ? (
              <Text style={styles.identityDetail} numberOfLines={3}>
                {serviceDescription}
              </Text>
            ) : null}
          </View>
          <StepTick tone={isTrusted && !serviceName ? 'bad' : claimTone} />
        </View>
      </View>

      <View style={styles.section}>
        <SectionLabel>{t('proofOfTrust.sectionOperatedBy')}</SectionLabel>
        <View style={styles.identityRow}>
          <View style={styles.identityBody}>
            <Text style={styles.identityName} numberOfLines={2}>
              {isTrusted
                ? operatorName
                  ? `${operatorName}${operatorCountry ? ` ${getFlagEmoji(operatorCountry)}` : ''}`
                  : t('proofOfTrust.noOperatorCredential')
                : status === ServiceStatus.Untrusted
                  ? t('proofOfTrust.operatorClaimsNotVerified')
                  : notCheckedText}
            </Text>
            {stringOf(operator?.address) && (
              <Text style={styles.identityDetail} numberOfLines={2}>
                {stringOf(operator?.address)}
              </Text>
            )}
            <RegistryChip label="REG" value={stringOf(operator?.registryId)} />
          </View>
          <StepTick tone={isTrusted && !operatorName ? 'bad' : claimTone} />
        </View>
      </View>

      {otherCredentials.length > 0 && (
        <View style={styles.section}>
          <SectionLabel>{t('proofOfTrust.sectionOtherCredentials')}</SectionLabel>
          {otherCredentials.map((credential) => (
            <Text key={credential.id} style={styles.identityDetail} numberOfLines={1}>
              {t('proofOfTrust.otherCredential', {
                schema: credential.credentialSchemaId,
                ecosystem: credential.ecosystemId,
              })}
            </Text>
          ))}
        </View>
      )}

      {status === ServiceStatus.Untrusted && (
        <View style={styles.section}>
          <SectionLabel>{t('proofOfTrust.sectionFailures')}</SectionLabel>
          <Text style={[styles.identityDetail, { color: veranaCardColors.bad }]}>
            {serviceInfo.untrustedReason === 'noDidDocument'
              ? t('proofOfTrust.noDidDocument')
              : t('proofOfTrust.notTrusted')}
          </Text>
          {failedCredentialIds.map((id) => (
            <Text key={id} style={styles.identityWithheld} numberOfLines={1} ellipsizeMode="middle">
              {id}
            </Text>
          ))}
        </View>
      )}

      {ask}

      {hasConditions && (
        <View style={styles.conditions}>
          <SectionLabel>{t('proofOfTrust.conditions')}</SectionLabel>
          {minimumAgeRequired > 0 && (
            <View style={styles.conditionRow}>
              <View style={styles.ageBadge}>
                <Text style={styles.ageBadgeText}>{`${minimumAgeRequired}+`}</Text>
              </View>
              <Text style={styles.conditionText}>{t('proofOfTrust.minimumAge', { age: minimumAgeRequired })}</Text>
            </View>
          )}
          {isHttpUri(serviceInfo.termsAndConditionsUrl) && (
            <TouchableOpacity
              style={styles.conditionRow}
              onPress={() => Linking.openURL(serviceInfo.termsAndConditionsUrl as string)}
            >
              <LockIcon color={veranaCardColors.brand} />
              <Text style={styles.conditionLink}>{t('invitation.termsAndConditions')}</Text>
              <ArrowUpRightIcon color={veranaCardColors.brand} />
            </TouchableOpacity>
          )}
          {isHttpUri(serviceInfo.dataPrivacyUrl) && (
            <TouchableOpacity
              style={styles.conditionRow}
              onPress={() => Linking.openURL(serviceInfo.dataPrivacyUrl as string)}
            >
              <LockIcon color={veranaCardColors.brand} />
              <Text style={styles.conditionLink}>{t('invitation.privacyPolicy')}</Text>
              <ArrowUpRightIcon color={veranaCardColors.brand} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {serviceInfo.network && !serviceInfo.network.production && (
        <Text style={styles.footnote}>{t('proofOfTrust.demoNetwork')}</Text>
      )}
    </View>
  )
}

export default memo(ProofOfTrustCard)
