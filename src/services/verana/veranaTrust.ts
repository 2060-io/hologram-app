export type VeranaTrustStatus = 'TRUSTED' | 'PARTIAL' | 'UNTRUSTED' | 'UNVERIFIED'

/**
 * verre returns a structurally valid `service`/`serviceProvider` even when the outcome is
 * `not-trusted`, which is exactly what a service issuing its own ECS credentials to itself looks
 * like. Only a schema anchored in a configured registry is evidence; anything else is a claim.
 */
export function areClaimsRegistryVerified(outcome: string | undefined): boolean {
  return outcome === 'verified' || outcome === 'verified-test'
}

export type VeranaTrustEvidence = {
  resolved: boolean
  hasServiceCredential: boolean
  hasOrganizationCredential: boolean
  structurallyValid?: boolean
}

/**
 * UNVERIFIED is wallet-local: verre's four outcomes cannot tell a resolver that could not be
 * reached from a counterparty the registry genuinely refuses, and only the second is an accusation.
 */
export function deriveVeranaTrustStatus(evidence: VeranaTrustEvidence): VeranaTrustStatus {
  if (!evidence.resolved) return 'UNVERIFIED'
  if (evidence.hasServiceCredential && evidence.hasOrganizationCredential) return 'TRUSTED'
  if (evidence.hasServiceCredential || evidence.hasOrganizationCredential) return 'PARTIAL'
  return 'UNTRUSTED'
}

export function describeVeranaVerdict(status: VeranaTrustStatus, evidence: VeranaTrustEvidence): string {
  if (status === 'UNVERIFIED') {
    return 'The Verana resolver could not be reached. This counterparty is neither trusted nor untrusted.'
  }
  if (status === 'TRUSTED') {
    return 'Both identity credentials verified against the Verana public registry'
  }
  if (status === 'PARTIAL') {
    return evidence.hasServiceCredential
      ? 'The service credential verified. Nothing verifies who operates it.'
      : 'The operator credential verified. Nothing verifies the service itself.'
  }
  return evidence.structurallyValid
    ? 'The Verana public registry does not vouch for this service.'
    : 'Neither identity credential verified. This counterparty cannot present verifiable trust credentials.'
}

/**
 * A service the resolver never answered for, and one cached before this field existed, are both
 * could-not-determine rather than a refusal.
 */
export function veranaTrustStatusOf(
  serviceInfo: { trustStatus?: VeranaTrustStatus } | undefined,
  failedFetchInfo?: boolean
): VeranaTrustStatus {
  if (failedFetchInfo || !serviceInfo?.trustStatus) return 'UNVERIFIED'
  return serviceInfo.trustStatus
}

/**
 * The pending flag only rises once the transition starts, so a DID with no answer and no failure
 * yet is still in flight. Without this the consent screen shows Accept for a frame before the
 * resolver has been asked anything.
 *
 * Only a verdict settles this. The cache hands back a placeholder assembled from an existing
 * connection so the screen can show a name while the resolver is still being asked, and treating
 * that as an answer makes the card state "the resolver could not be reached" before it was called.
 */
export function isVeranaResolutionPending(input: {
  did?: string
  serviceInfo?: { trustStatus?: VeranaTrustStatus }
  isFetchingInfo?: boolean
  failedFetchInfo?: boolean
}): boolean {
  if (input.isFetchingInfo) return true
  if (!input.did) return false
  return !input.failedFetchInfo && !input.serviceInfo?.trustStatus
}

export type VeranaGateInput = {
  trustStatus: VeranaTrustStatus
  isResolving: boolean
  permissionGranted?: boolean
  isCheckingPermission?: boolean
}

/**
 * Blocks on a refusal and while a check is still running, never on could-not-determine:
 * an unreachable registry is a warning, and refusing on it would punish a flaky network.
 */
export function isVeranaActionBlocked(input: VeranaGateInput): boolean {
  if (input.isResolving || input.isCheckingPermission) return true
  if (input.trustStatus === 'UNTRUSTED') return true
  return input.permissionGranted === false
}
