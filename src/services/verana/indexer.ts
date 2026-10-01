import { VERANA_NETWORKS, type VeranaNetwork } from './networks'

export type EcsCredential = {
  ecsSchema: string
  ecosystemId: number
  credentialSubject: Record<string, unknown>
}

export type TrustPresentation = {
  id: string
  vtcCredentials: { id: string; credentialSchemaId: number; ecosystemId: number }[]
  unresolvableCredentialIds?: string[]
  invalidCredentialIds?: string[]
}

export type ResolveResponse = {
  did: string
  trusted: boolean
  evaluatedAtTime: string
  expiresAtTime: string | null
  ecsCredentials?: EcsCredential[]
  presentations?: TrustPresentation[]
}

export type NetworkVerdict =
  | { network: VeranaNetwork; kind: 'trusted' | 'untrusted'; response?: ResolveResponse }
  | { network: VeranaNetwork; kind: 'failed'; error: unknown }

export type TrustResolution = {
  status: 'trusted' | 'untrusted' | 'unverified'
  verdict?: NetworkVerdict
  verdicts: NetworkVerdict[]
}

const REQUEST_TIMEOUT_MS = 8000

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const fetchJson = async (url: string, init?: RequestInit) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch(url, { ...init, signal: controller.signal })
    const body: unknown = await response.json().catch(() => undefined)
    return { status: response.status, body }
  } finally {
    clearTimeout(timer)
  }
}

const isResolveResponse = (body: unknown): body is ResolveResponse =>
  isObject(body) && typeof body.trusted === 'boolean' && typeof body.evaluatedAtTime === 'string'

const isDidNotFound = (status: number, body: unknown) =>
  status === 404 && isObject(body) && body.error === 'DID not found'

export const getEcosystemDid = async (network: VeranaNetwork, ecosystemId: number) => {
  const { status, body } = await fetchJson(`${network.indexerUrl}/v4/ecosystem/get/${ecosystemId}?gf_data=none`)
  const ecosystem = isObject(body) ? body.ecosystem : undefined
  if (status !== 200 || !isObject(ecosystem) || typeof ecosystem.did !== 'string') {
    throw new Error(`Ecosystem ${ecosystemId} lookup on ${network.id} failed with HTTP ${status}`)
  }
  return ecosystem.did
}

const passesEcosystemAllowList = async (network: VeranaNetwork, response: ResolveResponse) => {
  const allowed = network.ecosystemDids
  if (!allowed) return true
  const dids = await Promise.all((response.ecsCredentials ?? []).map((c) => getEcosystemDid(network, c.ecosystemId)))
  return dids.every((did) => allowed.includes(did))
}

const resolveOnNetwork = async (network: VeranaNetwork, did: string): Promise<NetworkVerdict> => {
  try {
    const { status, body } = await fetchJson(`${network.indexerUrl}/v4/verifiable-trust/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        did,
        ecsCredentials: true,
        presentations: { unresolvableCredentialIds: true, invalidCredentialIds: true },
      }),
    })
    if (isDidNotFound(status, body)) return { network, kind: 'untrusted' }
    if (status !== 200 || !isResolveResponse(body)) {
      return { network, kind: 'failed', error: new Error(`HTTP ${status} from ${network.id}`) }
    }
    const trusted = body.trusted && (await passesEcosystemAllowList(network, body))
    return { network, kind: trusted ? 'trusted' : 'untrusted', response: body }
  } catch (error) {
    return { network, kind: 'failed', error }
  }
}

const combineVerdicts = (verdicts: NetworkVerdict[]): TrustResolution => {
  const answered = verdicts.find((verdict) => verdict.kind === 'untrusted')
  const allAnswered = verdicts.every((verdict) => verdict.kind === 'untrusted')
  return { status: allAnswered ? 'untrusted' : 'unverified', verdict: answered, verdicts }
}

export const resolveTrust = (did: string, networks: VeranaNetwork[] = VERANA_NETWORKS) =>
  new Promise<TrustResolution>((resolve) => {
    const verdicts: NetworkVerdict[] = []
    for (const network of networks) {
      resolveOnNetwork(network, did).then((verdict) => {
        verdicts.push(verdict)
        if (verdict.kind === 'trusted') resolve({ status: 'trusted', verdict, verdicts })
        else if (verdicts.length === networks.length) resolve(combineVerdicts(verdicts))
      })
    }
  })
