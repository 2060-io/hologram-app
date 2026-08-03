import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import {
  checkVeranaPermission,
  describeAccreditation,
  fetchPermissions,
  findAccreditation,
  isPermissionActive,
  parsePermission,
  REGISTRY_UNREACHABLE_REASON,
  resolveVeranaAccreditation,
  SCHEMA_UNMATCHED_REASON,
} from './veranaPermissions.ts'
import type { VeranaPermission } from './veranaPermissions.ts'

const DID = 'did:webvh:Qme1B4:demo-issuer-accredited.playground.testnet.verana.network'
const BASE_URL = 'https://idx.testnet.verana.network/verana'

const permission = (overrides: Partial<VeranaPermission> = {}): VeranaPermission => ({
  id: '795',
  did: DID,
  schemaId: '253',
  type: 'ISSUER',
  validationState: 'VALIDATED',
  effectiveFrom: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

const NOW = new Date('2026-08-03T12:00:00.000Z')

const realFetch = globalThis.fetch

const stubFetch = (handler: (url: string) => unknown) => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const body = handler(String(input))
    if (body instanceof Error) throw body
    if (body === undefined) return { ok: false, status: 500, json: async () => ({}) } as Response
    return { ok: true, status: 200, json: async () => body } as Response
  }) as typeof fetch
}

afterEach(() => {
  globalThis.fetch = realFetch
})

describe('parsePermission', () => {
  it('accepts the indexer shape, where ids are numbers', () => {
    const parsed = parsePermission({ id: 795, schema_id: 253, type: 'ISSUER', did: DID, vp_state: 'VALIDATED' })
    assert.equal(parsed?.id, '795')
    assert.equal(parsed?.schemaId, '253')
    assert.equal(parsed?.validationState, 'VALIDATED')
  })

  it('accepts the node REST shape, where ids are strings', () => {
    const parsed = parsePermission({ id: '795', schema_id: '253', type: 'ISSUER', did: DID })
    assert.equal(parsed?.id, '795')
    assert.equal(parsed?.schemaId, '253')
  })

  it('reads revoked and slashed whether they arrive as block heights or timestamps', () => {
    const parsed = parsePermission({ id: 1, schema_id: 2, type: 'ISSUER', revoked: 4212, slashed: null })
    assert.equal(parsed?.revoked, '4212')
    assert.equal(parsed?.slashed, undefined)
  })

  it('drops a record that names no schema', () => {
    assert.equal(parsePermission({ id: 1, type: 'ISSUER' }), undefined)
    assert.equal(parsePermission('nope'), undefined)
  })
})

describe('isPermissionActive', () => {
  it('accepts a validated permission inside its window', () => {
    assert.equal(isPermissionActive(permission(), NOW), true)
  })

  it('refuses a PENDING permission - an application under review is not a grant', () => {
    assert.equal(isPermissionActive(permission({ validationState: 'PENDING' }), NOW), false)
  })

  it('refuses a TERMINATED permission', () => {
    assert.equal(isPermissionActive(permission({ validationState: 'TERMINATED' }), NOW), false)
  })

  it('refuses a revoked, slashed or terminated permission', () => {
    assert.equal(isPermissionActive(permission({ revoked: '4212' }), NOW), false)
    assert.equal(isPermissionActive(permission({ slashed: '4212' }), NOW), false)
    assert.equal(isPermissionActive(permission({ terminated: '4212' }), NOW), false)
  })

  it('refuses a permission that has not started or has lapsed', () => {
    assert.equal(isPermissionActive(permission({ effectiveFrom: '2026-09-01T00:00:00.000Z' }), NOW), false)
    assert.equal(isPermissionActive(permission({ effectiveUntil: '2026-07-01T00:00:00.000Z' }), NOW), false)
  })

  it('accepts an open-ended window', () => {
    assert.equal(isPermissionActive(permission({ effectiveUntil: undefined }), NOW), true)
  })
})

describe('findAccreditation', () => {
  const options = { did: DID, schemaId: '253', role: 'ISSUER' as const, at: NOW }

  it('grants on a live permission', () => {
    const result = findAccreditation([permission()], options)
    assert.equal(result.granted, true)
    assert.equal(result.reason, 'An active issuer permission covers this schema')
  })

  it('does not grant on a PENDING permission, and says why', () => {
    const result = findAccreditation([permission({ validationState: 'PENDING' })], options)
    assert.equal(result.granted, false)
    assert.equal(result.reason, 'A issuer permission for this schema is still pending validation')
  })

  it('distinguishes a lapsed permission from never having had one', () => {
    const lapsed = findAccreditation([permission({ effectiveUntil: '2026-07-01T00:00:00.000Z' })], options)
    assert.equal(lapsed.reason, 'A issuer permission exists for this schema but is no longer in force')
    assert.equal(findAccreditation([], options).reason, 'No issuer permission for this schema')
  })

  it('ignores permissions for another did, schema or role', () => {
    const others = [
      permission({ did: 'did:web:someone.else' }),
      permission({ schemaId: '999' }),
      permission({ type: 'VERIFIER' }),
    ]
    assert.equal(findAccreditation(others, options).granted, false)
  })

  it('grants when a live permission sits alongside a revoked one', () => {
    const result = findAccreditation([permission({ id: '1', revoked: '10' }), permission({ id: '2' })], options)
    assert.equal(result.granted, true)
  })
})

describe('fetchPermissions', () => {
  it('filters server-side on did, type and schema, and asks for a full page', async () => {
    let requested = ''
    stubFetch((url) => {
      requested = url
      return { permissions: [{ id: 795, schema_id: 253, type: 'ISSUER', did: DID, vp_state: 'VALIDATED' }] }
    })

    const permissions = await fetchPermissions(BASE_URL, { did: DID, role: 'ISSUER', schemaId: '253' })
    assert.equal(permissions?.length, 1)
    assert.ok(requested.startsWith(`${BASE_URL}/perm/v1/list?`))
    assert.ok(requested.includes(`did=${encodeURIComponent(DID)}`))
    assert.ok(requested.includes('type=ISSUER'))
    assert.ok(requested.includes('schema_id=253'))
    assert.ok(requested.includes('response_max_size=1000'))
  })

  it('returns undefined rather than an empty list when the registry errors', async () => {
    stubFetch(() => undefined)
    assert.equal(await fetchPermissions(BASE_URL, { did: DID, role: 'ISSUER', schemaId: '253' }), undefined)
  })

  it('returns undefined on a thrown transport error', async () => {
    stubFetch(() => new Error('offline'))
    assert.equal(await fetchPermissions(BASE_URL, { did: DID, role: 'ISSUER', schemaId: '253' }), undefined)
  })

  it('treats a full page as truncated rather than complete', async () => {
    const page = Array.from({ length: 1000 }, (_, index) => ({ id: index, schema_id: 253, type: 'ISSUER', did: DID }))
    stubFetch(() => ({ permissions: page }))
    assert.equal(await fetchPermissions(BASE_URL, { did: DID, role: 'ISSUER', schemaId: '253' }), undefined)
  })
})

describe('checkVeranaPermission', () => {
  it('reports could-not-determine, never false, when the registry is unreachable', async () => {
    stubFetch(() => new Error('offline'))
    const check = await checkVeranaPermission({ baseUrl: BASE_URL, did: DID, role: 'ISSUER', schemaId: '253' })
    assert.equal(check.granted, undefined)
    assert.equal(check.reason, REGISTRY_UNREACHABLE_REASON)
  })

  it('reports a genuine refusal as false', async () => {
    stubFetch(() => ({ permissions: [] }))
    const check = await checkVeranaPermission({ baseUrl: BASE_URL, did: DID, role: 'VERIFIER', schemaId: '253' })
    assert.equal(check.granted, false)
    assert.equal(check.reason, 'No verifier permission for this schema')
  })
})

describe('resolveVeranaAccreditation', () => {
  const anonCredsId = 'did:webvh:Qme1B4:issuer.example.org/resources/zQmCredDef'
  const resourceUrl = 'https://issuer.example.org/resources/zQmCredDef'
  const vtjscUrl = 'https://issuer.example.org/vt/demo-jsc.json'
  const registryBaseUrlFor = () => BASE_URL

  const happyRoutes = (url: string) => {
    if (url === resourceUrl) return { metadata: { relatedJsonSchemaCredentialId: vtjscUrl } }
    if (url === vtjscUrl) return { credentialSubject: { jsonSchema: { $ref: 'vpr:verana:vna-testnet-1/cs/v1/js/253' } } }
    if (url.startsWith(BASE_URL)) {
      return { permissions: [{ id: 795, schema_id: 253, type: 'ISSUER', did: DID, vp_state: 'VALIDATED' }] }
    }
    return undefined
  }

  it('walks cred_def to VTJSC to schema to permission', async () => {
    stubFetch(happyRoutes)
    const result = await resolveVeranaAccreditation({ did: DID, role: 'ISSUER', anonCredsId, registryBaseUrlFor })
    assert.equal(result.granted, true)
    assert.equal(result.schemaId, '253')
    assert.equal(result.jsonSchemaCredentialId, vtjscUrl)
  })

  it('does not grant when the only permission is PENDING', async () => {
    stubFetch((url) => {
      if (url.startsWith(BASE_URL)) {
        return { permissions: [{ id: 795, schema_id: 253, type: 'ISSUER', did: DID, vp_state: 'PENDING' }] }
      }
      return happyRoutes(url)
    })
    const result = await resolveVeranaAccreditation({ did: DID, role: 'ISSUER', anonCredsId, registryBaseUrlFor })
    assert.equal(result.granted, false)
  })

  it('reports could-not-determine when the schema cannot be resolved', async () => {
    stubFetch((url) => (url === resourceUrl ? { metadata: {} } : undefined))
    const result = await resolveVeranaAccreditation({ did: DID, role: 'ISSUER', anonCredsId, registryBaseUrlFor })
    assert.equal(result.granted, undefined)
    assert.equal(result.reason, SCHEMA_UNMATCHED_REASON)
  })

  it('reports could-not-determine when the registry is unknown to the wallet', async () => {
    stubFetch(happyRoutes)
    const result = await resolveVeranaAccreditation({
      did: DID,
      role: 'ISSUER',
      anonCredsId,
      registryBaseUrlFor: () => undefined,
    })
    assert.equal(result.granted, undefined)
  })
})

describe('describeAccreditation', () => {
  it('composes the granted and refused sentences', () => {
    const base = { party: 'Acme Bank', credential: 'Diploma' }
    assert.equal(
      describeAccreditation({ ...base, role: 'ISSUER', granted: true }),
      'Acme Bank is an authorized issuer of Diploma'
    )
    assert.equal(
      describeAccreditation({ ...base, role: 'VERIFIER', granted: false, ecosystem: 'Vesta Ecosystem' }),
      'Acme Bank is not an authorized verifier of Diploma in Vesta Ecosystem'
    )
  })
})
