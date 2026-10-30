import { useValidateKidAgeRestrictions } from '@src/hooks/useValidateKidAgeRestrictions'
import { ServiceInfo, ServiceStatus } from '@src/model'
import { getFlagEmoji } from '@src/utils'
import { widthPercentageToDP } from '@src/utils/responsiveUtils'
import { toast } from '@src/utils/toast'
import { Skeleton } from 'moti/skeleton'
import React, { memo, ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, TouchableOpacity, View } from 'react-native'
import Avatar from '../Avatar'
import FullScreenImage from '../FullScreenImage'
import Text from '../Text'
import {
  ArrowUpRightIcon,
  CheckIcon,
  CrossIcon,
  InfoIcon,
  LockIcon,
  RegistryChip,
  StepTick,
  StepTone,
  VeranaMark,
} from './parts'
import { useVeranaCard } from './useVeranaCard'

type Props = {
  serviceInfo: ServiceInfo
  isFetchingInfo: boolean
  failedFetchInfo?: boolean
  onRetry?: () => void
  ask?: ReactNode
  declaredName?: string
  declaredLogoUrl?: string
}

const OPERATOR_SCHEMAS = ['OrganizationCredential', 'PersonaCredential']
const LOGO_SIZE = '16%'

const stringOf = (value: unknown) => (typeof value === 'string' && value ? value : undefined)

const httpUriOf = (uri?: string) => (typeof uri === 'string' && /^https?:\/\//i.test(uri) ? uri : undefined)

type ChainStepProps = { tone: StepTone; label: string; isLast?: boolean; marker?: ReactNode; children: ReactNode }

const ChainStep = ({ tone, label, isLast, marker, children }: ChainStepProps) => {
  const { colors, styles } = useVeranaCard()
  const railColor = { ok: colors.okRail, bad: colors.badRail, none: colors.noneRail }[tone]
  return (
    <View style={styles.node}>
      <View style={styles.rail}>
        {marker ?? <StepTick tone={tone} />}
        {!isLast && <View style={[styles.connector, { backgroundColor: railColor }]} />}
      </View>
      <View style={[styles.nodeBody, isLast && styles.nodeBodyLast]}>
        <Text fontFamily="EuclidCircularA-Medium" style={styles.nodeLabel}>
          {label}
        </Text>
        {children}
      </View>
    </View>
  )
}

const ProofOfTrustCard = ({
  serviceInfo,
  isFetchingInfo,
  failedFetchInfo,
  onRetry,
  ask,
  declaredName,
  declaredLogoUrl,
}: Props) => {
  const { t } = useTranslation()
  const { colors, styles, isDarkMode } = useVeranaCard()
  const [fullScreenLogo, setFullScreenLogo] = useState<string>()
  const minimumAge = serviceInfo.minimumAgeRequired ?? 0
  const { ageRestricted } = useValidateKidAgeRestrictions({
    minimumAgeRequired: minimumAge,
    serviceStatus: serviceInfo.status,
  })

  const status = isFetchingInfo
    ? ServiceStatus.Resolving
    : failedFetchInfo
      ? ServiceStatus.Unverified
      : serviceInfo.status
  const isTrusted = status === ServiceStatus.Trusted
  const isUntrusted = status === ServiceStatus.Untrusted
  const statusColor = isTrusted ? colors.ok : isUntrusted ? colors.bad : colors.faint
  const statusLabel = {
    [ServiceStatus.Trusted]: t('proofOfTrust.statusTrusted'),
    [ServiceStatus.Untrusted]: t('proofOfTrust.statusUntrusted'),
    [ServiceStatus.Unverified]: t('proofOfTrust.statusUnverified'),
    [ServiceStatus.Resolving]: t('proofOfTrust.statusResolving'),
  }[status]
  const claimTone: StepTone = isUntrusted ? 'bad' : isTrusted ? 'ok' : 'none'
  const unprovenText = isUntrusted
    ? undefined
    : status === ServiceStatus.Resolving
      ? t('proofOfTrust.statusResolving')
      : t('proofOfTrust.notChecked')

  const ecsSubject = (schemas: string[]) =>
    isTrusted
      ? serviceInfo.ecsCredentials?.find((credential) => schemas.includes(credential.ecsSchema))?.credentialSubject
      : undefined
  const service = ecsSubject(['ServiceCredential'])
  const operator = ecsSubject(OPERATOR_SCHEMAS)
  const serviceName = stringOf(service?.name)
  const serviceDescription = stringOf(service?.description)
  const serviceTone: StepTone = isTrusted && !serviceName ? 'bad' : claimTone
  const operatorName = stringOf(operator?.name)
  const operatorCountry = stringOf(operator?.countryCode)
  const operatorAddress = stringOf(operator?.address)
  const operatorTone: StepTone = isTrusted && !operatorName ? 'bad' : claimTone
  const otherCredentials = isTrusted
    ? (serviceInfo.presentations ?? []).flatMap((presentation) => presentation.vtcCredentials ?? [])
    : []
  const failedCredentialIds = isUntrusted
    ? (serviceInfo.presentations ?? []).flatMap((presentation) => [
        ...(presentation.unresolvableCredentialIds ?? []),
        ...(presentation.invalidCredentialIds ?? []),
      ])
    : []

  const knownName = isTrusted ? serviceName || serviceInfo.name || declaredName : declaredName || serviceInfo.name
  const title = knownName && knownName !== serviceInfo.did ? knownName : ''
  const isTitleUnverified = Boolean(title) && !(isTrusted && serviceName) && status !== ServiceStatus.Resolving
  const logoUrl = isTrusted ? serviceInfo.logoUrl || declaredLogoUrl : declaredLogoUrl || serviceInfo.logoUrl
  const networkLabel = serviceInfo.network && !serviceInfo.network.production ? serviceInfo.network.label : undefined
  const termsUrl = isTrusted ? httpUriOf(serviceInfo.termsAndConditionsUrl) : undefined
  const privacyUrl = isTrusted ? httpUriOf(serviceInfo.dataPrivacyUrl) : undefined
  const hasConditions = isTrusted && (minimumAge > 0 || Boolean(termsUrl) || Boolean(privacyUrl))

  const openUrl = async (url: string) => {
    if (await Linking.canOpenURL(url)) await Linking.openURL(url)
    else toast({ type: 'error', message: `${t('general.canNotOpenURL')} ${url}` })
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.logo}>
          {isFetchingInfo ? (
            <Skeleton
              colorMode={isDarkMode ? 'dark' : 'light'}
              radius="round"
              height={widthPercentageToDP(LOGO_SIZE)}
              width={widthPercentageToDP(LOGO_SIZE)}
              show
            />
          ) : (
            <Avatar
              uri={logoUrl}
              label={title || serviceInfo.did}
              size={LOGO_SIZE}
              onImagePressed={setFullScreenLogo}
            />
          )}
          {!isFetchingInfo && (
            <View
              style={[
                styles.badge,
                { backgroundColor: isTrusted ? colors.ok : isUntrusted ? colors.bad : colors.noneRail },
              ]}
            >
              {isTrusted ? (
                <CheckIcon color={colors.onTint} size={12} />
              ) : isUntrusted ? (
                <CrossIcon color={colors.onTint} size={12} />
              ) : (
                <Text fontFamily="EuclidCircularA-SemiBold" style={styles.badgeUnknown}>
                  ?
                </Text>
              )}
            </View>
          )}
        </View>
        <View style={styles.headerBody}>
          <Text
            fontFamily="EuclidCircularA-Medium"
            style={title ? styles.title : styles.titleDid}
            numberOfLines={title ? 2 : 1}
            ellipsizeMode={title ? 'tail' : 'middle'}
          >
            {title || serviceInfo.did}
          </Text>
          {isTitleUnverified && (
            <View style={styles.declared}>
              <InfoIcon color={colors.warn} size={12} />
              <Text style={styles.declaredText}>{t('proofOfTrust.nameNotVerified')}</Text>
            </View>
          )}
          <View style={styles.verdictRow}>
            <Text fontFamily="EuclidCircularA-Medium" style={[styles.verdict, { color: statusColor }]}>
              {statusLabel}
            </Text>
            {networkLabel ? (
              <View style={styles.testnetChip}>
                <Text style={styles.testnetChipText}>{networkLabel}</Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={styles.mark}>
          <VeranaMark size={18} />
        </View>
      </View>

      <View style={styles.meta}>
        {title ? (
          <Text style={styles.metaText} numberOfLines={1} ellipsizeMode="middle">
            {serviceInfo.did}
          </Text>
        ) : null}
        {serviceInfo.evaluatedAtTime && status !== ServiceStatus.Resolving ? (
          <Text style={styles.metaText} numberOfLines={1}>
            {t('proofOfTrust.evaluatedAt', { date: new Date(serviceInfo.evaluatedAtTime).toLocaleString() })}
          </Text>
        ) : null}
      </View>
      {status === ServiceStatus.Unverified && onRetry && (
        <TouchableOpacity style={styles.retry} onPress={onRetry} accessibilityRole="button">
          <Text fontFamily="EuclidCircularA-Medium" style={styles.retryText}>
            {t('tryAgain')}
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.chain}>
        <ChainStep tone={serviceTone} label={t('proofOfTrust.sectionService')}>
          {serviceName ? (
            <Text fontFamily="EuclidCircularA-Medium" style={styles.nodeName} numberOfLines={2}>
              {serviceName}
            </Text>
          ) : (
            <Text style={styles.nodeWithheld}>
              {isTrusted
                ? t('proofOfTrust.noServiceCredential')
                : (unprovenText ?? t('proofOfTrust.serviceClaimsNotVerified'))}
            </Text>
          )}
          {serviceDescription ? (
            <Text style={styles.nodeDetail} numberOfLines={3}>
              {serviceDescription}
            </Text>
          ) : null}
        </ChainStep>
        <ChainStep tone={operatorTone} label={t('proofOfTrust.sectionOperatedBy')} isLast={!isTrusted}>
          {operatorName ? (
            <Text fontFamily="EuclidCircularA-Medium" style={styles.nodeName} numberOfLines={2}>
              {operatorCountry ? `${getFlagEmoji(operatorCountry)} ${operatorName}` : operatorName}
            </Text>
          ) : (
            <Text style={styles.nodeWithheld}>
              {isTrusted
                ? t('proofOfTrust.noOperatorCredential')
                : (unprovenText ?? t('proofOfTrust.operatorClaimsNotVerified'))}
            </Text>
          )}
          {operatorAddress ? (
            <Text style={styles.nodeDetail} numberOfLines={2}>
              {operatorAddress}
            </Text>
          ) : null}
          <RegistryChip label="REG" value={stringOf(operator?.registryId)} />
        </ChainStep>
        {otherCredentials.length > 0 && (
          <ChainStep tone="ok" label={t('proofOfTrust.sectionOtherCredentials')}>
            {otherCredentials.map((credential) => (
              <Text key={credential.id} style={styles.nodeDetail} numberOfLines={1}>
                {t('proofOfTrust.otherCredential', {
                  schema: credential.credentialSchemaId,
                  ecosystem: credential.ecosystemId,
                })}
              </Text>
            ))}
          </ChainStep>
        )}
        {isTrusted && (
          <ChainStep tone="ok" label={t('proofOfTrust.trustNetwork')} marker={<VeranaMark size={20} />} isLast>
            <Text fontFamily="EuclidCircularA-Medium" style={styles.nodeName}>
              {networkLabel ? `Verana ${networkLabel}` : 'Verana'}
            </Text>
          </ChainStep>
        )}
      </View>

      {isUntrusted && (
        <View style={styles.failures}>
          <Text fontFamily="EuclidCircularA-Medium" style={styles.failuresLabel}>
            {t('proofOfTrust.sectionFailures')}
          </Text>
          <Text style={styles.failuresReason}>
            {serviceInfo.untrustedReason === 'noDidDocument'
              ? t('proofOfTrust.noDidDocument')
              : t('proofOfTrust.notTrusted')}
          </Text>
          {failedCredentialIds.map((id) => (
            <Text key={id} style={styles.failuresId} numberOfLines={1} ellipsizeMode="middle">
              {id}
            </Text>
          ))}
        </View>
      )}

      {ask}

      {hasConditions && (
        <View style={styles.conditions}>
          <Text fontFamily="EuclidCircularA-Medium" style={styles.conditionsLabel}>
            {t('proofOfTrust.conditions')}
          </Text>
          {minimumAge > 0 && (
            <View style={styles.conditionRow}>
              <View style={[styles.ageBadge, ageRestricted ? styles.ageBadgeRestricted : styles.ageBadgeNeutral]}>
                <Text style={[styles.ageBadgeText, { color: ageRestricted ? colors.bad : colors.warn }]}>
                  {`${minimumAge}+`}
                </Text>
              </View>
              <Text style={[styles.conditionText, { color: ageRestricted ? colors.bad : colors.body }]}>
                {t('proofOfTrust.minimumAge', { age: minimumAge })}
              </Text>
            </View>
          )}
          {termsUrl && (
            <TouchableOpacity style={styles.conditionRow} onPress={() => openUrl(termsUrl)} accessibilityRole="link">
              <LockIcon color={colors.brand} />
              <Text style={styles.conditionLink}>{t('invitation.termsAndConditions')}</Text>
              <ArrowUpRightIcon color={colors.brand} />
            </TouchableOpacity>
          )}
          {privacyUrl && (
            <TouchableOpacity style={styles.conditionRow} onPress={() => openUrl(privacyUrl)} accessibilityRole="link">
              <LockIcon color={colors.brand} />
              <Text style={styles.conditionLink}>{t('invitation.privacyPolicy')}</Text>
              <ArrowUpRightIcon color={colors.brand} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {networkLabel ? <Text style={styles.footnote}>{t('proofOfTrust.demoNetwork')}</Text> : null}

      <FullScreenImage
        showFullScreenImage={Boolean(fullScreenLogo)}
        closeFullScreenImage={() => setFullScreenLogo(undefined)}
        imageUri={fullScreenLogo ?? ''}
      />
    </View>
  )
}

export default memo(ProofOfTrustCard)
