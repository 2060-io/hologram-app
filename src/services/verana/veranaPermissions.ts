import { resolveVtjscFromAnonCreds } from './veranaSchema.ts'

const REQUEST_TIMEOUT_MS = 10000

// The VPR list endpoints ignore `pagination.*` and default to 64 records; `response_max_size` is
// the parameter that widens the response. A full page is treated as truncated rather than complete.
const RESPONSE_MAX_SIZE = 1000

export type VeranaPermissionRole = 'ISSUER' | 'VERIFIER'

export type VeranaPermission = {
  id: string
  did: string
  schemaId: string
  type: string
  effectiveFrom?: string
  effectiveUntil?: string
  revoked?: string
  slashed?: string
  terminated?: string
  validationState?: string
}

export type VeranaPermissionCheck = {
  granted: boolean | undefined
  reason: string
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined

// The indexer serialises ids as numbers, the node's REST API as strings. Rejecting either shape
// drops every record and reads as "not accredited".
const asIdentifier = (value: unknown): string | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return asString(value)
}

const asTimestamp = (value: unknown): string | undefined => {
  if (typeof value === 'number') return value > 0 ? String(value) : undefined
  return asString(value)
}

export function parsePermission(value: unknown): VeranaPermission | undefined {
  if (!isRecord(value)) return undefined

  const id = asIdentifier(value.id)
  const schemaId = asIdentifier(value.schema_id)
  const type = asString(value.type)
  if (!id || !schemaId || !type) return undefined

  return {
    id,
    schemaId,
    type,
    did: asString(value.did) ?? '',
    effectiveFrom: asString(value.effective_from),
    effectiveUntil: asString(value.effective_until),
    revoked: asTimestamp(value.revoked),
    slashed: asTimestamp(value.slashed),
    terminated: asTimestamp(value.terminated),
    validationState: asString(value.vp_state),
  }
}

/**
 * PENDING is an application under review, not a grant, and the live testnet holds such records.
 * An expired accreditation is byte-identical to a live one apart from its window, so the window
 * is the check that matters most.
 */
export function isPermissionActive(permission: VeranaPermission, at: Date = new Date()): boolean {
  if (permission.revoked || permission.slashed || permission.terminated) return false
  if (permission.validationState === 'PENDING' || permission.validationState === 'TERMINATED') return false

  const now = at.getTime()
  if (permission.effectiveFrom) {
    const from = Date.parse(permission.effectiveFrom)
    if (Number.isFinite(from) && from > now) return false
  }
  if (permission.effectiveUntil) {
    const until = Date.parse(permission.effectiveUntil)
    if (Number.isFinite(until) && until <= now) return false
  }
  return true
}

export function findAccreditation(
  permissions: VeranaPermission[],
  options: { did: string; schemaId: string; role: VeranaPermissionRole; at?: Date }
): VeranaPermissionCheck {
  const role = options.role.toLowerCase()
  const forRole = permissions.filter(
    (permission) =>
      permission.did === options.did && permission.schemaId === options.schemaId && permission.type === options.role
  )

  if (forRole.some((permission) => isPermissionActive(permission, options.at))) {
    return { granted: true, reason: `An active ${role} permission covers this schema` }
  }
  if (forRole.some((permission) => permission.validationState === 'PENDING')) {
    return { granted: false, reason: `A ${role} permission for this schema is still pending validation` }
  }
  if (forRole.length) {
    return { granted: false, reason: `A ${role} permission exists for this schema but is no longer in force` }
  }
  return { granted: false, reason: `No ${role} permission for this schema` }
}

export async function fetchPermissions(
  baseUrl: string,
  options: { did: string; role: VeranaPermissionRole; schemaId: string }
): Promise<VeranaPermission[] | undefined> {
  const query = new URLSearchParams({
    did: options.did,
    type: options.role,
    schema_id: options.schemaId,
    response_max_size: String(RESPONSE_MAX_SIZE),
  })
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch(`${baseUrl}/perm/v1/list?${query.toString()}`, { signal: controller.signal })
    if (!response.ok) return undefined

    const body: unknown = await response.json()
    if (!isRecord(body) || !Array.isArray(body.permissions) || body.permissions.length >= RESPONSE_MAX_SIZE) {
      return undefined
    }
    return body.permissions
      .map(parsePermission)
      .filter((permission): permission is VeranaPermission => permission !== undefined)
  } catch {
    return undefined
  } finally {
    clearTimeout(timeout)
  }
}

export const REGISTRY_UNREACHABLE_REASON =
  'The Verana registry could not be reached, so this permission could not be checked'

export const SCHEMA_UNMATCHED_REASON =
  'This credential type could not be matched to a Verana schema, so the permission could not be checked'

export const PERMISSION_PENDING_REASON = 'Checking the Verana public registry…'

/**
 * `granted: undefined` is could-not-determine, never a refusal: an unreachable registry or a
 * credential type that maps to no Verana schema must not render as "not accredited".
 */
export async function checkVeranaPermission(options: {
  baseUrl: string
  did: string
  role: VeranaPermissionRole
  schemaId: string
  at?: Date
}): Promise<VeranaPermissionCheck> {
  const permissions = await fetchPermissions(options.baseUrl, options)
  if (!permissions) return { granted: undefined, reason: REGISTRY_UNREACHABLE_REASON }
  return findAccreditation(permissions, options)
}

export function describeAccreditation(options: {
  party: string
  role: VeranaPermissionRole
  credential: string
  granted: boolean
  ecosystem?: string
}): string {
  const article = options.granted ? 'an' : 'not an'
  const authority = options.role === 'ISSUER' ? 'authorized issuer' : 'authorized verifier'
  const ecosystem = options.ecosystem ? ` in ${options.ecosystem}` : ''
  return `${options.party} is ${article} ${authority} of ${options.credential}${ecosystem}`
}

export type VeranaAccreditation = VeranaPermissionCheck & {
  jsonSchemaCredentialId?: string
  schemaId?: string
}

export async function resolveVeranaAccreditation(options: {
  did: string
  role: VeranaPermissionRole
  anonCredsId: string
  registryBaseUrlFor: (registryId: string) => string | undefined
  at?: Date
}): Promise<VeranaAccreditation> {
  const resolution = await resolveVtjscFromAnonCreds(options.anonCredsId)
  if (!resolution.reachable) return { granted: undefined, reason: REGISTRY_UNREACHABLE_REASON }
  if (!resolution.jsonSchema) {
    return {
      granted: undefined,
      reason: SCHEMA_UNMATCHED_REASON,
      jsonSchemaCredentialId: resolution.jsonSchemaCredentialId,
    }
  }

  const baseUrl = options.registryBaseUrlFor(resolution.jsonSchema.registryId)
  if (!baseUrl) return { granted: undefined, reason: SCHEMA_UNMATCHED_REASON }

  const check = await checkVeranaPermission({
    baseUrl,
    did: options.did,
    role: options.role,
    schemaId: resolution.jsonSchema.schemaId,
    at: options.at,
  })
  return {
    ...check,
    jsonSchemaCredentialId: resolution.jsonSchemaCredentialId,
    schemaId: resolution.jsonSchema.schemaId,
  }
}
