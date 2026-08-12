import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import {
  anonCredsResourceUrl,
  parseJsonSchemaRef,
  readJsonSchemaPointer,
  resolveVtjscFromAnonCreds,
} from './veranaSchema.ts'

const WEBVH_CRED_DEF =
  'did:webvh:Qme1B4nVokhtHA6uLzKZNzN6VdqMft3xQYzpeMo2Jz8ojy:demo-issuer-accredited.playground.testnet.verana.network/resources/zQmThVqqis6LkKVPKiZEwhdSxApJnFZ1cHBdt1MstmKWpob'

const RESOURCE_URL =
  'https://demo-issuer-accredited.playground.testnet.verana.network/resources/zQmThVqqis6LkKVPKiZEwhdSxApJnFZ1cHBdt1MstmKWpob'

const VTJSC_URL = 'https://playground-demo.playground.testnet.verana.network/vt/schemas-demo-credential-jsc.json'

const realFetch = globalThis.fetch

const stubFetch = (routes: Record<string, unknown>) => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input)
    if (!(url in routes)) return { ok: false, status: 404, json: async () => ({}) } as Response
    const body = routes[url]
    if (body instanceof Error) throw body
    return { ok: true, status: 200, json: async () => body } as Response
  }) as typeof fetch
}

afterEach(() => {
  globalThis.fetch = realFetch
})

describe('anonCredsResourceUrl', () => {
  it('maps a did:webvh attested-resource identifier to its /resources/ route', () => {
    assert.equal(anonCredsResourceUrl(WEBVH_CRED_DEF), RESOURCE_URL)
  })

  it('maps the did:web relativeRef query form to the same /resources/ route', () => {
    const id = 'did:web:issuer.example.org?service=anoncreds&relativeRef=/credDef/zQmAbc'
    assert.equal(anonCredsResourceUrl(id), 'https://issuer.example.org/resources/zQmAbc')
  })

  it('keeps a did:web path prefix', () => {
    const id = 'did:web:example.org:agents:one?service=anoncreds&relativeRef=/schema/zQmXyz'
    assert.equal(anonCredsResourceUrl(id), 'https://example.org/agents/one/resources/zQmXyz')
  })

  it('passes an https identifier through untouched', () => {
    assert.equal(anonCredsResourceUrl('https://host/resources/abc'), 'https://host/resources/abc')
  })

  it('returns undefined for an unsupported identifier', () => {
    assert.equal(anonCredsResourceUrl('did:indy:sovrin:F72i3Y3Q4i466efjYJYCHM'), undefined)
    assert.equal(anonCredsResourceUrl('not-a-did'), undefined)
  })
})

describe('readJsonSchemaPointer', () => {
  it('reads $ref, which is what live VTJSCs actually carry', () => {
    const vtjsc = { credentialSubject: { jsonSchema: { $ref: 'vpr:verana:vna-testnet-1/cs/v1/js/253' } } }
    assert.equal(readJsonSchemaPointer(vtjsc), 'vpr:verana:vna-testnet-1/cs/v1/js/253')
  })

  it('prefers $id when both are present', () => {
    const vtjsc = {
      credentialSubject: {
        jsonSchema: { $id: 'vpr:verana:vna-testnet-1/cs/v1/js/1', $ref: 'vpr:verana:vna-testnet-1/cs/v1/js/2' },
      },
    }
    assert.equal(readJsonSchemaPointer(vtjsc), 'vpr:verana:vna-testnet-1/cs/v1/js/1')
  })

  it('falls back to credentialSubject.id when jsonSchema carries no pointer', () => {
    const vtjsc = { credentialSubject: { jsonSchema: {}, id: 'vpr:verana:vna-testnet-1/cs/v1/js/9' } }
    assert.equal(readJsonSchemaPointer(vtjsc), 'vpr:verana:vna-testnet-1/cs/v1/js/9')
  })

  it('unwraps a verifiable presentation and an array subject', () => {
    const vtjsc = {
      verifiableCredential: [{ credentialSubject: [{ jsonSchema: { $ref: 'vpr:verana:vna-testnet-1/cs/v1/js/7' } }] }],
    }
    assert.equal(readJsonSchemaPointer(vtjsc), 'vpr:verana:vna-testnet-1/cs/v1/js/7')
  })

  it('returns undefined for a malformed document', () => {
    assert.equal(readJsonSchemaPointer(undefined), undefined)
    assert.equal(readJsonSchemaPointer({ credentialSubject: 'nope' }), undefined)
  })
})

describe('parseJsonSchemaRef', () => {
  it('splits a vpr reference into registry and schema id', () => {
    assert.deepEqual(parseJsonSchemaRef('vpr:verana:vna-testnet-1/cs/v1/js/253'), {
      ref: 'vpr:verana:vna-testnet-1/cs/v1/js/253',
      registryId: 'vpr:verana:vna-testnet-1',
      schemaId: '253',
    })
  })

  it('rejects a reference that names no schema', () => {
    assert.equal(parseJsonSchemaRef('vpr:verana:vna-testnet-1/cs/v1/js/'), undefined)
    assert.equal(parseJsonSchemaRef('https://example.org/whatever'), undefined)
  })
})

describe('resolveVtjscFromAnonCreds', () => {
  it('follows the resource metadata to the VTJSC and out to the $ref schema', async () => {
    stubFetch({
      [RESOURCE_URL]: { metadata: { relatedJsonSchemaCredentialId: VTJSC_URL } },
      [VTJSC_URL]: { credentialSubject: { jsonSchema: { $ref: 'vpr:verana:vna-testnet-1/cs/v1/js/253' } } },
    })

    const resolution = await resolveVtjscFromAnonCreds(WEBVH_CRED_DEF)
    assert.equal(resolution.reachable, true)
    assert.equal(resolution.jsonSchemaCredentialId, VTJSC_URL)
    assert.equal(resolution.jsonSchema?.schemaId, '253')
    assert.equal(resolution.jsonSchema?.registryId, 'vpr:verana:vna-testnet-1')
  })

  it('reports unreachable when the resource cannot be fetched', async () => {
    stubFetch({})
    const resolution = await resolveVtjscFromAnonCreds(WEBVH_CRED_DEF)
    assert.equal(resolution.reachable, false)
    assert.equal(resolution.jsonSchema, undefined)
  })

  it('reports unreachable when the VTJSC itself cannot be fetched', async () => {
    stubFetch({ [RESOURCE_URL]: { metadata: { relatedJsonSchemaCredentialId: VTJSC_URL } } })
    const resolution = await resolveVtjscFromAnonCreds(WEBVH_CRED_DEF)
    assert.equal(resolution.reachable, false)
    assert.equal(resolution.jsonSchemaCredentialId, VTJSC_URL)
  })

  it('is reachable but unmatched when the resource names no VTJSC', async () => {
    stubFetch({ [RESOURCE_URL]: { metadata: {} } })
    const resolution = await resolveVtjscFromAnonCreds(WEBVH_CRED_DEF)
    assert.equal(resolution.reachable, true)
    assert.equal(resolution.jsonSchemaCredentialId, undefined)
  })

  it('survives a thrown transport error', async () => {
    stubFetch({ [RESOURCE_URL]: new Error('offline') })
    const resolution = await resolveVtjscFromAnonCreds(WEBVH_CRED_DEF)
    assert.equal(resolution.reachable, false)
  })
})
