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
  ask?: VeranaTrustAsk
}

const VERDICT_TONE: Record<VeranaTrustStatus, { color: string; labelKey: string }> = {
  TRUSTED: { color: veranaCardColors.ok, labelKey: 'veranaTrust.verdictTrusted' },
  PARTIAL: { color: veranaCardColors.warn, labelKey: 'veranaTrust.verdictPartial' },
  UNTRUSTED: { color: veranaCardColors.bad, labelKey: 'veranaTrust.verdictUntrusted' },
  UNVERIFIED: { color: veranaCardColors.faint, labelKey: 'veranaTrust.verdictUnverified' },
}

const isHttpUri = (uri?: string): uri is string => typeof uri === 'string' && /^https?:\/\//i.test(uri)

const VeranaTrustCard = ({ did, serviceInfo, trustStatus, isFetchingInfo, ask }: Props) => {
  const { t } = useTranslation()
  const organization = serviceInfo?.serviceProvider
  const hasServiceCredential = Boolean(serviceInfo?.name)
  const hasOrganizationCredential = Boolean(organization?.entityName)
  const tone = VERDICT_TONE[trustStatus]

  const stepTone = (present: boolean): StepTone => (trustStatus === 'UNVERIFIED' ? 'none' : present ? 'ok' : 'bad')

  const withheldDetail = trustStatus === 'UNVERIFIED' ? t('veranaTrust.notChecked') : t('veranaTrust.claimsWithheld')

  const minimumAgeRequired = serviceInfo?.minimumAgeRequired ?? 0
  const hasConditions =
    minimumAgeRequired > 0 || isHttpUri(serviceInfo?.termsAndConditionsUrl) || isHttpUri(serviceInfo?.dataPrivacyUrl)

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

      <View style={styles.section}>
        <SectionLabel>{t('veranaTrust.sectionService')}</SectionLabel>
        <View style={styles.identityRow}>
          <View style={styles.identityBody}>
            <Text style={styles.identityName} numberOfLines={2}>
              {serviceInfo?.name || t('veranaTrust.notPresented')}
            </Text>
            {hasServiceCredential ? (
              <Text style={styles.identityDetail} numberOfLines={3}>
                {serviceInfo?.description}
              </Text>
            ) : (
              <Text style={styles.identityWithheld} numberOfLines={3}>
                {trustStatus === 'UNVERIFIED' ? withheldDetail : t('veranaTrust.noServiceCredential')}
              </Text>
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
                {organization?.entityName || t('veranaTrust.notPresented')}
              </Text>
              <CountryFlag code={organization?.countryCode} />
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
                {trustStatus === 'UNVERIFIED' ? withheldDetail : t('veranaTrust.noOrganizationCredential')}
              </Text>
            )}
          </View>
          <StepTick tone={stepTone(hasOrganizationCredential)} />
        </View>
      </View>

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
                trustStatus === 'PARTIAL' || trustStatus === 'UNTRUSTED' ? veranaCardColors.bad : veranaCardColors.sub,
            },
          ]}
        >
          {describeVeranaVerdict(trustStatus, {
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

      {isFetchingInfo && <Text style={styles.loading}>{t('veranaTrust.resolving')}</Text>}

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
