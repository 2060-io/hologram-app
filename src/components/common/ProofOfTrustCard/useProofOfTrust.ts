import { useValidateKidAgeRestrictions } from '@src/hooks/useValidateKidAgeRestrictions'
import { ServiceInfo, ServiceStatus } from '@src/model'
import { useTranslation } from 'react-i18next'
import { StepTone } from './parts'
import { useVeranaCard } from './useVeranaCard'

type Props = {
  serviceInfo: ServiceInfo
  isFetchingInfo: boolean
  failedFetchInfo?: boolean
  declaredName?: string
  declaredLogoUrl?: string
}

export type ProofOfTrust = ReturnType<typeof useProofOfTrust>

const OPERATOR_SCHEMAS = ['OrganizationCredential', 'PersonaCredential']

const stringOf = (value: unknown) => (typeof value === 'string' && value ? value : undefined)

const httpUriOf = (uri?: string) => (typeof uri === 'string' && /^https?:\/\//i.test(uri) ? uri : undefined)

export const useProofOfTrust = ({
  serviceInfo,
  isFetchingInfo,
  failedFetchInfo,
  declaredName,
  declaredLogoUrl,
}: Props) => {
  const { t } = useTranslation()
  const { colors } = useVeranaCard()
  const status = isFetchingInfo
    ? ServiceStatus.Resolving
    : failedFetchInfo
      ? ServiceStatus.Unverified
      : serviceInfo.status
  const isTrusted = status === ServiceStatus.Trusted
  const isUntrusted = status === ServiceStatus.Untrusted
  const minimumAge = serviceInfo.minimumAgeRequired ?? 0
  const { ageRestricted } = useValidateKidAgeRestrictions({
    minimumAgeRequired: minimumAge,
    serviceStatus: serviceInfo.status,
  })

  const tone = {
    [ServiceStatus.Trusted]: { color: colors.ok, label: t('proofOfTrust.statusTrusted') },
    [ServiceStatus.Untrusted]: { color: colors.bad, label: t('proofOfTrust.statusUntrusted') },
    [ServiceStatus.Unverified]: { color: colors.faint, label: t('proofOfTrust.statusUnverified') },
    [ServiceStatus.Resolving]: { color: colors.faint, label: t('proofOfTrust.statusResolving') },
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
  const operatorName = stringOf(operator?.name)

  const termsUrl = isTrusted ? httpUriOf(serviceInfo.termsAndConditionsUrl) : undefined
  const privacyUrl = isTrusted ? httpUriOf(serviceInfo.dataPrivacyUrl) : undefined
  const hasConditions = isTrusted && (minimumAge > 0 || Boolean(termsUrl) || Boolean(privacyUrl))

  return {
    status,
    isTrusted,
    statusColor: tone.color,
    statusLabel: tone.label,
    did: serviceInfo.did,
    networkLabel: serviceInfo.network && !serviceInfo.network.production ? serviceInfo.network.label : undefined,
    evaluatedAt:
      serviceInfo.evaluatedAtTime && status !== ServiceStatus.Resolving
        ? t('proofOfTrust.evaluatedAt', { date: new Date(serviceInfo.evaluatedAtTime).toLocaleString() })
        : undefined,
    title: (isTrusted ? serviceName || serviceInfo.name || declaredName : declaredName || serviceInfo.name) || '',
    titleVerified: isTrusted && Boolean(serviceName),
    logoUrl: isTrusted ? serviceInfo.logoUrl || declaredLogoUrl : declaredLogoUrl || serviceInfo.logoUrl,
    service: {
      name: serviceName,
      description: stringOf(service?.description),
      tone: (isTrusted && !serviceName ? 'bad' : claimTone) as StepTone,
      fallback: isTrusted
        ? t('proofOfTrust.noServiceCredential')
        : (unprovenText ?? t('proofOfTrust.serviceClaimsNotVerified')),
    },
    operator: {
      name: operatorName,
      countryCode: stringOf(operator?.countryCode),
      address: stringOf(operator?.address),
      registryId: stringOf(operator?.registryId),
      tone: (isTrusted && !operatorName ? 'bad' : claimTone) as StepTone,
      fallback: isTrusted
        ? t('proofOfTrust.noOperatorCredential')
        : (unprovenText ?? t('proofOfTrust.operatorClaimsNotVerified')),
    },
    otherCredentials: isTrusted
      ? (serviceInfo.presentations ?? [])
          .flatMap((presentation) => presentation.vtcCredentials ?? [])
          .map((credential) => ({
            id: credential.id,
            label: t('proofOfTrust.otherCredential', {
              schema: credential.credentialSchemaId,
              ecosystem: credential.ecosystemId,
            }),
          }))
      : [],
    failure: isUntrusted
      ? {
          reason:
            serviceInfo.untrustedReason === 'noDidDocument'
              ? t('proofOfTrust.noDidDocument')
              : t('proofOfTrust.notTrusted'),
          credentialIds: (serviceInfo.presentations ?? []).flatMap((presentation) => [
            ...(presentation.unresolvableCredentialIds ?? []),
            ...(presentation.invalidCredentialIds ?? []),
          ]),
        }
      : undefined,
    conditions: hasConditions ? { minimumAge, ageRestricted, termsUrl, privacyUrl } : undefined,
  }
}
