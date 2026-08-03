const REQUEST_TIMEOUT_MS = 10000

export type VeranaJsonSchemaRef = {
  ref: string
  registryId: string
  schemaId: string
}

export type VeranaSchemaResolution = {
  reachable: boolean
  jsonSchemaCredentialId?: string
  jsonSchema?: VeranaJsonSchemaRef
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined

const didToHttpsBase = (did: string): string | undefined => {
  const parts = did.split(':')
  if (parts[0] !== 'did') return undefined
  // did:webvh carries the SCID between the method and the domain; did:web goes straight to it.
  const segments = parts[1] === 'webvh' ? parts.slice(3) : parts[1] === 'web' ? parts.slice(2) : undefined
  if (!segments?.length) return undefined
  return `https://${segments.map(decodeURIComponent).join('/')}`
}

/**
 * AnonCreds identifiers on the Verana rail are either a did:webvh attested-resource URL
 * (`did:webvh:<scid>:<host>/resources/<id>`) or the older did:web query form
 * (`did:web:<host>?service=anoncreds&relativeRef=/credDef/<id>`). Both resolve to the same
 * `/resources/<id>` route, which is the only one carrying `relatedJsonSchemaCredentialId`.
 */
export function anonCredsResourceUrl(identifier: string): string | undefined {
  if (/^https?:\/\//i.test(identifier)) return identifier

  const [didPart, query] = identifier.split('?')
  const [did, ...pathParts] = didPart.split('/')

  const relativeRef = query ? new URLSearchParams(query).get('relativeRef') : undefined
  const resourceId = (relativeRef ?? pathParts.join('/')).split('/').filter(Boolean).pop()
  if (!resourceId) return undefined

  const base = didToHttpsBase(did)
  return base ? `${base}/resources/${resourceId}` : undefined
}

/**
 * Live VTJSCs carry the pointer as `credentialSubject.jsonSchema.$ref`, with a copy in
 * `credentialSubject.id`; `$id` is the published-schema variant. Reading only `$id` finds nothing.
 */
export function readJsonSchemaPointer(document: unknown): string | undefined {
  if (!isRecord(document)) return undefined

  const credential = Array.isArray(document.verifiableCredential) ? document.verifiableCredential[0] : document
  if (!isRecord(credential)) return undefined

  const subject = Array.isArray(credential.credentialSubject)
    ? credential.credentialSubject[0]
    : credential.credentialSubject
  if (!isRecord(subject)) return undefined

  const jsonSchema = isRecord(subject.jsonSchema) ? subject.jsonSchema : undefined
  return asString(jsonSchema?.$id) ?? asString(jsonSchema?.$ref) ?? asString(subject.id)
}

const JSON_SCHEMA_REF = /^(vpr:[^/]+|https?:\/\/[^/]+)\/cs\/v\d+\/js\/(\d+)$/

export function parseJsonSchemaRef(ref: string): VeranaJsonSchemaRef | undefined {
  const match = JSON_SCHEMA_REF.exec(ref)
  if (!match) return undefined
  return { ref, registryId: match[1], schemaId: match[2] }
}

const fetchJson = async (url: string): Promise<unknown> => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) return undefined
    return await response.json()
  } catch {
    return undefined
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * `reachable: false` is could-not-determine. A schema that resolves to no VPR reference is
 * reachable but unmatched, and the two must stay distinguishable for the consent copy.
 */
export async function resolveVtjscFromAnonCreds(schemaIdOrCredDefId: string): Promise<VeranaSchemaResolution> {
  const resourceUrl = anonCredsResourceUrl(schemaIdOrCredDefId)
  if (!resourceUrl) return { reachable: true }

  const resource = await fetchJson(resourceUrl)
  if (!isRecord(resource)) return { reachable: false }

  const metadata = isRecord(resource.metadata) ? resource.metadata : undefined
  const jsonSchemaCredentialId = asString(metadata?.relatedJsonSchemaCredentialId)
  if (!jsonSchemaCredentialId) return { reachable: true }

  const vtjsc = await fetchJson(jsonSchemaCredentialId)
  if (vtjsc === undefined) return { reachable: false, jsonSchemaCredentialId }

  const pointer = readJsonSchemaPointer(vtjsc)
  return { reachable: true, jsonSchemaCredentialId, jsonSchema: pointer ? parseJsonSchemaRef(pointer) : undefined }
}
