import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  areClaimsRegistryVerified,
  deriveVeranaTrustStatus,
  describeVeranaVerdict,
  isVeranaActionBlocked,
  isVeranaResolutionPending,
} from './veranaTrust.ts'

describe('deriveVeranaTrustStatus', () => {
  it('is TRUSTED only when both identity credentials verified', () => {
    const status = deriveVeranaTrustStatus({
      resolved: true,
      hasServiceCredential: true,
      hasOrganizationCredential: true,
    })
    assert.equal(status, 'TRUSTED')
  })

  it('is PARTIAL when exactly one verified', () => {
    assert.equal(
      deriveVeranaTrustStatus({ resolved: true, hasServiceCredential: true, hasOrganizationCredential: false }),
      'PARTIAL'
    )
    assert.equal(
      deriveVeranaTrustStatus({ resolved: true, hasServiceCredential: false, hasOrganizationCredential: true }),
      'PARTIAL'
    )
  })

  it('is UNTRUSTED when the resolver answered and neither verified', () => {
    assert.equal(
      deriveVeranaTrustStatus({ resolved: true, hasServiceCredential: false, hasOrganizationCredential: false }),
      'UNTRUSTED'
    )
  })

  it('is UNVERIFIED, not UNTRUSTED, when the resolver never answered', () => {
    assert.equal(
      deriveVeranaTrustStatus({ resolved: false, hasServiceCredential: false, hasOrganizationCredential: false }),
      'UNVERIFIED'
    )
  })
})

describe('describeVeranaVerdict', () => {
  it('uses the shared cross-wallet wording', () => {
    assert.equal(
      describeVeranaVerdict('TRUSTED', { resolved: true, hasServiceCredential: true, hasOrganizationCredential: true }),
      'Both identity credentials verified against the Verana public registry'
    )
    assert.equal(
      describeVeranaVerdict('PARTIAL', {
        resolved: true,
        hasServiceCredential: true,
        hasOrganizationCredential: false,
      }),
      'The service credential verified. Nothing verifies who operates it.'
    )
    assert.equal(
      describeVeranaVerdict('PARTIAL', {
        resolved: true,
        hasServiceCredential: false,
        hasOrganizationCredential: true,
      }),
      'The operator credential verified. Nothing verifies the service itself.'
    )
    assert.equal(
      describeVeranaVerdict('UNVERIFIED', {
        resolved: false,
        hasServiceCredential: false,
        hasOrganizationCredential: false,
      }),
      'The Verana resolver could not be reached. This counterparty is neither trusted nor untrusted.'
    )
  })

  it('separates a structurally valid but unvouched counterparty from one with no credentials', () => {
    const base = { resolved: true, hasServiceCredential: false, hasOrganizationCredential: false }
    assert.equal(
      describeVeranaVerdict('UNTRUSTED', { ...base, structurallyValid: true }),
      'The Verana public registry does not vouch for this service.'
    )
    assert.equal(
      describeVeranaVerdict('UNTRUSTED', base),
      'Neither identity credential verified. This counterparty cannot present verifiable trust credentials.'
    )
  })
})

describe('isVeranaActionBlocked', () => {
  it('blocks while the resolution is in flight', () => {
    assert.equal(isVeranaActionBlocked({ trustStatus: 'UNVERIFIED', isResolving: true }), true)
  })

  it('blocks while a permission check is in flight', () => {
    assert.equal(
      isVeranaActionBlocked({ trustStatus: 'TRUSTED', isResolving: false, isCheckingPermission: true }),
      true
    )
  })

  it('blocks on UNTRUSTED', () => {
    assert.equal(isVeranaActionBlocked({ trustStatus: 'UNTRUSTED', isResolving: false }), true)
  })

  it('blocks on a permission the registry refused', () => {
    assert.equal(isVeranaActionBlocked({ trustStatus: 'TRUSTED', isResolving: false, permissionGranted: false }), true)
  })

  it('does NOT block on could-not-determine - that is a warning, not a refusal', () => {
    assert.equal(
      isVeranaActionBlocked({ trustStatus: 'UNVERIFIED', isResolving: false, permissionGranted: undefined }),
      false
    )
    assert.equal(
      isVeranaActionBlocked({ trustStatus: 'TRUSTED', isResolving: false, permissionGranted: undefined }),
      false
    )
  })

  it('allows a trusted, accredited counterparty', () => {
    assert.equal(isVeranaActionBlocked({ trustStatus: 'TRUSTED', isResolving: false, permissionGranted: true }), false)
  })

  it('allows PARTIAL, which is a warning rather than a refusal', () => {
    assert.equal(isVeranaActionBlocked({ trustStatus: 'PARTIAL', isResolving: false }), false)
  })
})

describe('areClaimsRegistryVerified', () => {
  it('accepts a schema anchored in a configured registry, production or test', () => {
    assert.equal(areClaimsRegistryVerified('verified'), true)
    assert.equal(areClaimsRegistryVerified('verified-test'), true)
  })

  it('refuses not-trusted, which is what a self-issued ECS credential resolves to', () => {
    assert.equal(areClaimsRegistryVerified('not-trusted'), false)
  })

  it('refuses invalid and a missing outcome', () => {
    assert.equal(areClaimsRegistryVerified('invalid'), false)
    assert.equal(areClaimsRegistryVerified(undefined), false)
  })
})

describe('isVeranaResolutionPending', () => {
  it('is pending while the transition runs', () => {
    assert.equal(isVeranaResolutionPending({ did: 'did:webvh:x', isFetchingInfo: true }), true)
  })

  it('is pending before the resolver has been asked, when the flag has not risen yet', () => {
    assert.equal(isVeranaResolutionPending({ did: 'did:webvh:x' }), true)
  })

  it('settles once a verdict arrives', () => {
    assert.equal(isVeranaResolutionPending({ did: 'did:webvh:x', serviceInfo: { trustStatus: 'TRUSTED' } }), false)
  })

  it('stays pending on a placeholder built from a connection, which carries no verdict', () => {
    const fromConnection = { name: 'Accredited Issuer (demo)', trustStatus: undefined }
    assert.equal(isVeranaResolutionPending({ did: 'did:webvh:x', serviceInfo: fromConnection }), true)
  })

  it('settles on a failure, which is could-not-determine rather than in flight', () => {
    assert.equal(isVeranaResolutionPending({ did: 'did:webvh:x', failedFetchInfo: true }), false)
  })

  it('is never pending when there is no DID to resolve', () => {
    assert.equal(isVeranaResolutionPending({}), false)
    assert.equal(isVeranaResolutionPending({ did: '' }), false)
  })
})
