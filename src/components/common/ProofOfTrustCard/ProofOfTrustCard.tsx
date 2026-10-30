import { ServiceInfo, ServiceStatus } from '@src/model'
import { getFlagEmoji } from '@src/utils'
import React, { memo, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, TouchableOpacity, View } from 'react-native'
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
import ServiceLogo from './ServiceLogo'
import { useProofOfTrust } from './useProofOfTrust'
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

type ChainNode = {
  key: string
  tone: StepTone
  marker?: ReactNode
  label?: string
  content: ReactNode
}

const TONE_RANK: Record<StepTone, number> = { ok: 0, none: 1, bad: 2 }

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
  const { colors, styles, theme } = useVeranaCard()
  const trust = useProofOfTrust({ serviceInfo, isFetchingInfo, failedFetchInfo, declaredName, declaredLogoUrl })

  const railColor: Record<StepTone, string> = { ok: colors.okRail, bad: colors.badRail, none: colors.noneRail }
  const badgeColor =
    trust.status === ServiceStatus.Trusted
      ? colors.ok
      : trust.status === ServiceStatus.Untrusted
        ? colors.bad
        : colors.noneRail
  const titleIsDid = !trust.title
  const titleSelfDeclared = !trust.titleVerified && !titleIsDid && trust.status !== ServiceStatus.Resolving
  const { service, operator, failure, conditions } = trust

  const nodes: ChainNode[] = [
    {
      key: 'service',
      tone: service.tone,
      label: t('proofOfTrust.sectionService'),
      content: (
        <>
          {service.name ? (
            <Text fontFamily="EuclidCircularA-Medium" style={styles.nodeName} numberOfLines={2}>
              {service.name}
            </Text>
          ) : (
            <Text style={styles.nodeWithheld}>{service.fallback}</Text>
          )}
          {service.description ? (
            <Text style={styles.nodeDetail} numberOfLines={3}>
              {service.description}
            </Text>
          ) : null}
        </>
      ),
    },
    {
      key: 'operator',
      tone: operator.tone,
      label: t('proofOfTrust.sectionOperatedBy'),
      content: (
        <>
          {operator.name ? (
            <Text fontFamily="EuclidCircularA-Medium" style={styles.nodeName} numberOfLines={2}>
              {operator.countryCode ? `${getFlagEmoji(operator.countryCode)} ${operator.name}` : operator.name}
            </Text>
          ) : (
            <Text style={styles.nodeWithheld}>{operator.fallback}</Text>
          )}
          {operator.address ? (
            <Text style={styles.nodeDetail} numberOfLines={2}>
              {operator.address}
            </Text>
          ) : null}
          <RegistryChip label="REG" value={operator.registryId} />
        </>
      ),
    },
    ...trust.otherCredentials.map((credential, index) => ({
      key: `credential-${credential.id}`,
      tone: 'ok' as StepTone,
      label: index === 0 ? t('proofOfTrust.sectionOtherCredentials') : undefined,
      content: (
        <Text style={[styles.nodeDetail, index > 0 && styles.nodeNameInline]} numberOfLines={1}>
          {credential.label}
        </Text>
      ),
    })),
    ...(trust.isTrusted
      ? [
          {
            key: 'network',
            tone: 'ok' as StepTone,
            marker: <VeranaMark size={20} />,
            label: t('proofOfTrust.trustNetwork'),
            content: (
              <Text fontFamily="EuclidCircularA-Medium" style={styles.nodeName}>
                {trust.networkLabel ? `Verana ${trust.networkLabel}` : 'Verana'}
              </Text>
            ),
          },
        ]
      : []),
  ]

  let worstTone: StepTone = 'ok'

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.logo}>
          <ServiceLogo uri={trust.logoUrl} label={trust.title || trust.did} size="16%" isLoading={isFetchingInfo} />
          {trust.status !== ServiceStatus.Resolving && (
            <View style={[styles.badge, { backgroundColor: badgeColor }]}>
              {trust.status === ServiceStatus.Trusted ? (
                <CheckIcon color={colors.onTint} size={12} />
              ) : trust.status === ServiceStatus.Untrusted ? (
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
          {titleIsDid ? (
            <Text fontFamily="EuclidCircularA-Medium" style={styles.titleDid} numberOfLines={1} ellipsizeMode="middle">
              {trust.did}
            </Text>
          ) : (
            <Text fontFamily="EuclidCircularA-Medium" style={styles.title} numberOfLines={2}>
              {trust.title}
            </Text>
          )}
          {titleSelfDeclared && (
            <View style={styles.declared}>
              <InfoIcon color={colors.warn} size={12} />
              <Text style={styles.declaredText}>{t('proofOfTrust.nameNotVerified')}</Text>
            </View>
          )}
          <View style={styles.verdictRow}>
            <Text fontFamily="EuclidCircularA-Medium" style={[styles.verdict, { color: trust.statusColor }]}>
              {trust.statusLabel}
            </Text>
            {trust.networkLabel ? (
              <View style={styles.testnetChip}>
                <Text style={styles.testnetChipText}>{trust.networkLabel}</Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={styles.mark}>
          <VeranaMark size={18} />
        </View>
      </View>

      <View style={styles.meta}>
        {!titleIsDid && (
          <Text style={styles.metaText} numberOfLines={1} ellipsizeMode="middle">
            {trust.did}
          </Text>
        )}
        {trust.evaluatedAt ? (
          <Text style={styles.metaText} numberOfLines={1}>
            {trust.evaluatedAt}
          </Text>
        ) : null}
      </View>
      {trust.status === ServiceStatus.Unverified && onRetry && (
        <TouchableOpacity style={styles.retry} onPress={onRetry} accessibilityRole="button">
          <Text fontFamily="EuclidCircularA-Medium" style={styles.retryText}>
            {t('tryAgain')}
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.chain}>
        {nodes.map((node, index) => {
          const isLast = index === nodes.length - 1
          if (TONE_RANK[node.tone] > TONE_RANK[worstTone]) worstTone = node.tone
          return (
            <View key={node.key} style={styles.node}>
              <View style={styles.rail}>
                {node.marker ?? <StepTick tone={node.tone} />}
                {!isLast && <View style={[styles.connector, { backgroundColor: railColor[worstTone] }]} />}
              </View>
              <View style={[styles.nodeBody, isLast && styles.nodeBodyLast]}>
                {node.label ? (
                  <Text fontFamily="EuclidCircularA-Medium" style={styles.nodeLabel}>
                    {node.label}
                  </Text>
                ) : null}
                {node.content}
              </View>
            </View>
          )
        })}
      </View>

      {failure && (
        <View style={styles.failures}>
          <Text fontFamily="EuclidCircularA-Medium" style={styles.failuresLabel}>
            {t('proofOfTrust.sectionFailures')}
          </Text>
          <Text style={styles.failuresReason}>{failure.reason}</Text>
          {failure.credentialIds.map((id) => (
            <Text key={id} style={styles.failuresId} numberOfLines={1} ellipsizeMode="middle">
              {id}
            </Text>
          ))}
        </View>
      )}

      {ask}

      {conditions && (
        <View style={styles.conditions}>
          <Text fontFamily="EuclidCircularA-Medium" style={styles.conditionsLabel}>
            {t('proofOfTrust.conditions')}
          </Text>
          {conditions.minimumAge > 0 && (
            <View style={styles.conditionRow}>
              <View
                style={[
                  styles.ageBadge,
                  conditions.ageRestricted
                    ? { borderColor: colors.bad, backgroundColor: colors.badSoft }
                    : { borderColor: colors.warnLine, backgroundColor: theme.colors.primary },
                ]}
              >
                <Text
                  style={[styles.ageBadgeText, { color: conditions.ageRestricted ? colors.bad : colors.warn }]}
                >{`${conditions.minimumAge}+`}</Text>
              </View>
              <Text style={[styles.conditionText, { color: conditions.ageRestricted ? colors.bad : colors.body }]}>
                {t('proofOfTrust.minimumAge', { age: conditions.minimumAge })}
              </Text>
            </View>
          )}
          {conditions.termsUrl && (
            <TouchableOpacity
              style={styles.conditionRow}
              onPress={() => conditions.termsUrl && Linking.openURL(conditions.termsUrl)}
              accessibilityRole="link"
            >
              <LockIcon color={colors.brand} />
              <Text style={styles.conditionLink}>{t('invitation.termsAndConditions')}</Text>
              <ArrowUpRightIcon color={colors.brand} />
            </TouchableOpacity>
          )}
          {conditions.privacyUrl && (
            <TouchableOpacity
              style={styles.conditionRow}
              onPress={() => conditions.privacyUrl && Linking.openURL(conditions.privacyUrl)}
              accessibilityRole="link"
            >
              <LockIcon color={colors.brand} />
              <Text style={styles.conditionLink}>{t('invitation.privacyPolicy')}</Text>
              <ArrowUpRightIcon color={colors.brand} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {trust.networkLabel ? <Text style={styles.footnote}>{t('proofOfTrust.demoNetwork')}</Text> : null}
    </View>
  )
}

export default memo(ProofOfTrustCard)
