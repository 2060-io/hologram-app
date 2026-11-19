import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const TIMEOUT_MS = 15000
const catalogue = JSON.parse(readFileSync(new URL('../services.json', import.meta.url), 'utf8'))
const out = resolve(process.env.E2E_OUT ?? 'e2e-out')

const isObject = (value) => typeof value === 'object' && value !== null

const request = async (url, init) => {
  let response
  try {
    response = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) })
  } catch (error) {
    throw new Error(`${init?.method ?? 'GET'} ${url}: ${error.cause?.code ?? error.message}`)
  }
  const text = await response.text()
  let body
  try {
    body = JSON.parse(text)
  } catch {
    body = text
  }
  return { status: response.status, body }
}

const describe = (status, body) => `HTTP ${status} ${(isObject(body) ? JSON.stringify(body) : body).slice(0, 120)}`

const checkHealth = async (url) => {
  const { status, body } = await request(url)
  const health = isObject(body) ? body : {}
  const versions = []
  if (health.chatbotVersion) versions.push(`chatbot ${health.chatbotVersion}`)
  if (health.vsAgentVersion) versions.push(`vs-agent ${health.vsAgentVersion}`)
  const version = versions.join(', ')
  if (status !== 200 || health.status !== 'ok') return { problem: `health: ${describe(status, body)}`, version }
  return { version }
}

const readDidDocument = async (url) => {
  const { status, body } = await request(url)
  if (status !== 200 || !isObject(body) || typeof body.id !== 'string') {
    return { problem: `did.json: ${describe(status, body)}` }
  }
  const candidates = Array.isArray(body.alsoKnownAs) ? body.alsoKnownAs : []
  const aliases = candidates.filter((alias) => typeof alias === 'string' && alias.startsWith('did:'))
  return { did: body.id, aliases }
}

const resolveOn = async (network, did) => {
  try {
    const { status, body } = await request(`${catalogue.indexers[network]}/v4/verifiable-trust/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ did, ecsCredentials: true }),
    })
    if (status === 404 && isObject(body) && body.error === 'DID not found') return { network, kind: 'untrusted' }
    if (status !== 200 || !isObject(body) || typeof body.trusted !== 'boolean') {
      return { network, kind: 'failed', error: describe(status, body) }
    }
    return { network, kind: body.trusted ? 'trusted' : 'untrusted', response: body }
  } catch (error) {
    return { network, kind: 'failed', error: String(error) }
  }
}

const resolveDid = async (did) => {
  const verdicts = await Promise.all(Object.keys(catalogue.indexers).map((network) => resolveOn(network, did)))
  const trusted = verdicts.find((verdict) => verdict.kind === 'trusted')
  if (trusted) return { status: 'trusted', did, verdict: trusted, verdicts }
  const status = verdicts.every((verdict) => verdict.kind === 'untrusted') ? 'untrusted' : 'unverified'
  return { status, did, verdicts }
}

const resolveTrust = async (did, aliases) => {
  const resolution = await resolveDid(did)
  if (resolution.status === 'trusted') return resolution
  let fallback = resolution
  for (const alias of aliases) {
    const aliasResolution = await resolveDid(alias)
    if (aliasResolution.status === 'trusted') return aliasResolution
    if (fallback.status === 'untrusted' && aliasResolution.status === 'unverified') fallback = aliasResolution
  }
  return fallback
}

const minimumAgeOf = (resolution) => {
  const service = resolution.verdict?.response?.ecsCredentials?.find(
    (credential) => credential.ecsSchema === 'ServiceCredential'
  )
  const age = service?.credentialSubject?.minimumAgeRequired
  return typeof age === 'number' ? age : 0
}

const checkPlaygroundInvitation = async (id, service) => {
  const action = service.invitation === 'playground-request' ? '&action=request' : ''
  const api = `${catalogue.env.PLAYGROUND_API}/${id}?format=anoncreds${action}`
  const offer = await request(api)
  if (offer.status !== 200 || !isObject(offer.body) || typeof offer.body.url !== 'string') {
    return `playground: ${describe(offer.status, offer.body)}`
  }
  const invitation = await request(offer.body.url)
  if (invitation.status !== 200 || !isObject(invitation.body) || typeof invitation.body['@type'] !== 'string') {
    return `invitation ${offer.body.url}: ${describe(invitation.status, invitation.body)}`
  }
}

const checkService = async (id, service) => {
  const problems = []
  const notes = []
  const result = { id, trust: '', minimumAge: '', version: '', ageMismatch: false }
  try {
    if (service.health) {
      const health = await checkHealth(service.health)
      result.version = health.version
      if (health.problem) problems.push(health.problem)
    }
    const document = await readDidDocument(service.didDocument)
    if (document.problem) {
      problems.push(document.problem)
    } else {
      const webvh = document.aliases.find((alias) => alias.startsWith('did:webvh:'))
      if (!service.health) result.version = webvh ? webvh.split(':').slice(0, 3).join(':') : document.did
      const resolution = await resolveTrust(document.did, document.aliases)
      const network = resolution.verdict?.network
      result.trust = network ? `${resolution.status} (${network})` : resolution.status
      if (resolution.status !== service.status || (network && network !== service.network)) {
        const failures = resolution.verdicts.filter((verdict) => verdict.kind === 'failed')
        const reasons = failures.map((verdict) => `${verdict.network}: ${verdict.error}`)
        const expected = `expected ${service.status} (${service.network})`
        problems.push([`trust: ${result.trust}, ${expected}`, ...reasons].join(', '))
      }
      if (resolution.status === 'trusted') {
        const minimumAge = minimumAgeOf(resolution)
        result.minimumAge = String(minimumAge)
        if (minimumAge !== service.minimumAge) {
          result.ageMismatch = true
          notes.push(`minimum age ${minimumAge}, expected ${service.minimumAge}: skips svc-${id}-minimum-age`)
        }
      }
    }
    if (service.invitation.startsWith('playground-')) {
      const problem = await checkPlaygroundInvitation(id, service)
      if (problem) problems.push(problem)
    }
  } catch (error) {
    problems.push(error instanceof Error ? error.message : String(error))
  }
  return { ...result, healthy: problems.length === 0, notes: [...problems, ...notes] }
}

const results = await Promise.all(Object.entries(catalogue.services).map(([id, service]) => checkService(id, service)))

const cell = (text) => String(text).replace(/\|/g, '\\|').replace(/\s+/g, ' ')
const lines = [
  '### Services',
  '',
  '| Service | Status | Trust | Min age | Version | Notes |',
  '| --- | --- | --- | --- | --- | --- |',
]
for (const result of results) {
  const status = result.healthy ? 'healthy' : 'skipped: infra'
  const columns = [result.id, status, result.trust, result.minimumAge, result.version, result.notes.join('; ')]
  lines.push(`| ${columns.map(cell).join(' | ')} |`)
  console.log(`${result.id}: ${status}${result.notes.length ? ` (${result.notes.join('; ')})` : ''}`)
}

mkdirSync(out, { recursive: true })
const skipped = [
  ...results.filter((result) => !result.healthy).map((result) => `${result.id}\n`),
  ...results.filter((result) => result.ageMismatch).map((result) => `${result.id}-minimum-age\n`),
]
writeFileSync(join(out, 'skipped-services.txt'), skipped.join(''))
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`)
else console.log(`\n${lines.join('\n')}`)
