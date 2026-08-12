import { ServiceInfo } from '@src/model'
import {
  describeVeranaVerdict,
  isVeranaTestnet,
  VERANA_EXPLORER_URL,
  VeranaPermissionCheck,
  VeranaTrustStatus,
} from '@src/services/verana'
import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, TouchableOpacity, View } from 'react-native'
import Text from '../Text'
import {
  ArrowUpRightIcon,
  CheckIcon,
  CountryFlag,
  CrossIcon,
  InfoIcon,
  LockIcon,
  RegistryChip,
  SectionLabel,
  StepTick,
  StepTone,
  VeranaMark,
} from './parts'
import styles, { veranaCardColors } from './styles'

export type VeranaTrustAsk = {
  kind: 'offer' | 'request'
  credential: string
  party: string
  accreditation?: VeranaPermissionCheck
  isChecking: boolean
}

type Props = {
  did: string
  serviceInfo?: ServiceInfo
  trustStatus: VeranaTrustStatus
  isFetchingInfo: boolean
  isResolving?: boolean
  ask?: VeranaTrustAsk
}

const VERDICT_TONE: Record<VeranaTrustStatus, { color: string; labelKey: string }> = {
  TRUSTED: { color: veranaCardColors.ok, labelKey: 'veranaTrust.verdictTrusted' },
  PARTIAL: { color: veranaCardColors.warn, labelKey: 'veranaTrust.verdictPartial' },
  UNTRUSTED: { color: veranaCardColors.bad, labelKey: 'veranaTrust.verdictUntrusted' },
  UNVERIFIED: { color: veranaCardColors.faint, labelKey: 'veranaTrust.verdictUnverified' },
}

const RESOLVING_TONE = { color: veranaCardColors.faint, labelKey: 'veranaTrust.verdictResolving' }

const isHttpUri = (uri?: string): uri is string => typeof uri === 'string' && /^https?:\/\//i.test(uri)

const VeranaTrustCard = ({ did, serviceInfo, trustStatus, isFetchingInfo, isResolving, ask }: Props) => {
  const { t } = useTranslation()
  const organization = serviceInfo?.serviceProvider
  const claimsVerified = Boolean(serviceInfo?.claimsVerified)
  const serviceCredentialPresented = Boolean(serviceInfo?.name)
  const organizationCredentialPresented = Boolean(organization?.entityName)
  const hasServiceCredential = claimsVerified && serviceCredentialPresented
  const hasOrganizationCredential = claimsVerified && organizationCredentialPresented
  const tone = isResolving ? RESOLVING_TONE : VERDICT_TONE[trustStatus]
  // Nothing has been checked yet, or nothing came back. Either way the chain has no rows to show,
  // and drawing empty ones reads as a finding about the counterparty rather than about the check.
  const showChain = !isResolving && trustStatus !== 'UNVERIFIED'

  const stepTone = (present: boolean): StepTone => (present ? 'ok' : 'bad')

  const withheldDetail =
    trustStatus === 'UNVERIFIED'
      ? t('veranaTrust.notChecked')
      : serviceInfo?.claimsSelfIssued
        ? t('veranaTrust.claimsSelfIssued')
        : t('veranaTrust.claimsWithheld')

  const minimumAgeRequired = serviceInfo?.minimumAgeRequired ?? 0
  // Conditions read off the ECS-Service credential, so they are claims too: an unanchored service
  // does not get to state binding conditions on this surface.
  const hasConditions =
    claimsVerified &&
    (minimumAgeRequired > 0 || isHttpUri(serviceInfo?.termsAndConditionsUrl) || isHttpUri(serviceInfo?.dataPrivacyUrl))

  return (
    <View style={styles.card}>
      <View style={styles.didRow}>
        <View style={[styles.didDot, { backgroundColor: tone.color }]} />
        <Text style={styles.didText} numberOfLines={1}>
          {did}
        </Text>
        {isVeranaTestnet && (
          <View style={styles.testnetChip}>
            <Text style={styles.testnetChipText}>{t('veranaTrust.testnet')}</Text>
          </View>
        )}
        <VeranaMark />
      </View>

      {showChain && (
        <>
          <View style={styles.section}>
            <SectionLabel>{t('veranaTrust.sectionService')}</SectionLabel>
            <View style={styles.identityRow}>
              <View style={styles.identityBody}>
                <Text style={styles.identityName} numberOfLines={2}>
                  {hasServiceCredential
                    ? serviceInfo?.name
                    : serviceCredentialPresented
                      ? t('veranaTrust.serviceClaimsNotVerified')
                      : t('veranaTrust.noServiceCredential')}
                </Text>
                {hasServiceCredential ? (
                  <Text style={styles.identityDetail} numberOfLines={3}>
                    {serviceInfo?.description}
                  </Text>
                ) : (
                  serviceCredentialPresented && (
                    <Text style={styles.identityWithheld} numberOfLines={3}>
                      {withheldDetail}
                    </Text>
                  )
                )}
              </View>
              <StepTick tone={stepTone(hasServiceCredential)} />
            </View>
          </View>

          <View style={styles.section}>
            <SectionLabel>{t('veranaTrust.sectionOperatedBy')}</SectionLabel>
            <View style={styles.identityRow}>
              <View style={styles.identityBody}>
                <View style={styles.identityHeadingRow}>
                  <Text style={styles.identityName} numberOfLines={2}>
                    {hasOrganizationCredential
                      ? organization?.entityName
                      : organizationCredentialPresented
                        ? t('veranaTrust.operatorClaimsNotVerified')
                        : t('veranaTrust.noOrganizationCredential')}
                  </Text>
                  {hasOrganizationCredential && <CountryFlag code={organization?.countryCode} />}
                </View>
                {hasOrganizationCredential ? (
                  <>
                    {organization?.address ? (
                      <Text style={styles.identityDetail} numberOfLines={2}>
                        {organization.address}
                      </Text>
                    ) : null}
                    <RegistryChip
                      label={t('veranaTrust.registryChip')}
                      value={organization?.officialPublicRegistryNumber}
                    />
                  </>
                ) : (
                  <Text style={styles.identityWithheld} numberOfLines={3}>
                    {organizationCredentialPresented ? withheldDetail : t('veranaTrust.nothingVerifiesOperator')}
                  </Text>
                )}
              </View>
              <StepTick tone={stepTone(hasOrganizationCredential)} />
            </View>
          </View>
        </>
      )}

      <View style={styles.verdictStack}>
        <View style={[styles.verdictPill, { borderColor: tone.color }]}>
          <VeranaMark />
          <Text
            fontFamily="EuclidCircularA-Medium"
            style={[styles.verdictPillLabel, { color: tone.color }]}
            numberOfLines={1}
          >
            {t(tone.labelKey)}
          </Text>
        </View>
        <Text
          style={[
            styles.verdictNote,
            {
              color:
                !isResolving && (trustStatus === 'PARTIAL' || trustStatus === 'UNTRUSTED')
                  ? veranaCardColors.bad
                  : veranaCardColors.sub,
            },
          ]}
        >
          {isResolving
            ? t('veranaTrust.checkingRegistry')
            : describeVeranaVerdict(trustStatus, {
                resolved: trustStatus !== 'UNVERIFIED',
                hasServiceCredential,
                hasOrganizationCredential,
                structurallyValid: serviceInfo?.status === 'not-trusted',
              })}
        </Text>
      </View>

      {ask && <AskBlock ask={ask} />}

      {hasConditions && (
        <View style={styles.conditions}>
          <SectionLabel>{t('veranaTrust.sectionConditions')}</SectionLabel>
          <View style={styles.conditionRow}>
            {minimumAgeRequired > 0 ? (
              <>
                <View style={styles.ageBadge}>
                  <Text
                    fontFamily="EuclidCircularA-Medium"
                    style={styles.ageBadgeText}
                  >{`${minimumAgeRequired}+`}</Text>
                </View>
                <Text style={styles.conditionText} numberOfLines={2}>
                  {t('veranaTrust.ageRestriction', { age: minimumAgeRequired })}
                </Text>
              </>
            ) : (
              <>
                <InfoIcon color={veranaCardColors.faint} size={13} />
                <Text style={styles.conditionText}>{t('veranaTrust.noAgeRestriction')}</Text>
              </>
            )}
          </View>
          <ConditionLink
            label={t('veranaTrust.termsAndConditions')}
            uri={serviceInfo?.termsAndConditionsUrl}
            digest={serviceInfo?.termsAndConditionsDigestSri}
          />
          <ConditionLink
            label={t('veranaTrust.privacyPolicy')}
            uri={serviceInfo?.dataPrivacyUrl}
            digest={serviceInfo?.dataPrivacyDigestSri}
          />
        </View>
      )}

      {isFetchingInfo && !isResolving && <Text style={styles.loading}>{t('veranaTrust.resolving')}</Text>}

      <TouchableOpacity
        accessibilityRole="link"
        style={styles.explorerRow}
        onPress={() => Linking.openURL(`${VERANA_EXPLORER_URL}/did/${encodeURIComponent(did)}`)}
      >
        <Text style={styles.explorerText} numberOfLines={1}>
          {t('veranaTrust.openInVerana')}
        </Text>
        <ArrowUpRightIcon color={veranaCardColors.brand} />
      </TouchableOpacity>

      {isVeranaTestnet && <Text style={styles.footnote}>{t('veranaTrust.demoNetwork')}</Text>}
    </View>
  )
}

const AskBlock = ({ ask }: { ask: VeranaTrustAsk }) => {
  const { t } = useTranslation()
  const granted = ask.isChecking ? undefined : ask.accreditation?.granted
  const background =
    granted === true
      ? veranaCardColors.okSoft
      : granted === false
        ? veranaCardColors.badSoft
        : veranaCardColors.neutralSoft
  const border =
    granted === true ? veranaCardColors.okRail : granted === false ? veranaCardColors.badRail : veranaCardColors.line

  const sentence =
    granted === undefined
      ? ask.isChecking
        ? t('veranaTrust.checkingRegistry')
        : (ask.accreditation?.reason ?? t('veranaTrust.permissionUncheckable'))
      : t(granted ? 'veranaTrust.authorizedFor' : 'veranaTrust.notAuthorizedFor', {
          party: ask.party,
          authority: t(ask.kind === 'offer' ? 'veranaTrust.authorizedIssuer' : 'veranaTrust.authorizedVerifier'),
          credential: ask.credential,
        })

  return (
    <View style={[styles.askBlock, { backgroundColor: background, borderColor: border }]}>
      <SectionLabel>
        {t(ask.kind === 'offer' ? 'veranaTrust.sectionOffersYou' : 'veranaTrust.sectionAsksYouFor')}
      </SectionLabel>
      <Text fontFamily="EuclidCircularA-Medium" style={styles.askCredential} numberOfLines={2}>
        {ask.credential}
      </Text>
      <View style={styles.askRow}>
        {granted === true ? (
          <CheckIcon color={veranaCardColors.ok} />
        ) : granted === false ? (
          <CrossIcon color={veranaCardColors.bad} />
        ) : (
          <InfoIcon color={veranaCardColors.faint} />
        )}
        <Text style={styles.askText}>{sentence}</Text>
      </View>
    </View>
  )
}

const ConditionLink = ({ label, uri, digest }: { label: string; uri?: string; digest?: string }) => {
  const { t } = useTranslation()
  if (!isHttpUri(uri)) return null
  return (
    <TouchableOpacity accessibilityRole="link" style={styles.conditionRow} onPress={() => Linking.openURL(uri)}>
      <LockIcon color={veranaCardColors.brand} />
      <Text style={styles.conditionLink} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.conditionState}>
        {digest ? (
          <>
            <CheckIcon color={veranaCardColors.ok} size={11} />
            <Text style={styles.conditionIntact}>{t('veranaTrust.intact')}</Text>
          </>
        ) : (
          <Text style={styles.conditionNoDigest}>{t('veranaTrust.noDigest')}</Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

export default memo(VeranaTrustCard)
