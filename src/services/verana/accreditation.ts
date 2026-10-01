import type { W3cDataIntegritySecuredDocument } from '@credo-ts/core'
import type { MobileAgent } from '@src/services/agent/MobileAgent'
import { logWarn } from '@src/utils'
import { fetchJson, getEcosystemDid, isObject } from './indexer'
import { VERANA_NETWORKS, type VeranaNetwork } from './networks'

export type AccreditationRole = 'ISSUER' | 'VERIFIER'

export type AnonCredsReference = { kind: 'credentialDefinition' | 'schema'; id: string }

export type Accreditation = {
  status: 'authorized' | 'unauthorized' | 'unverified'
  schemaTitles: string[]
}

type CredentialSchema = { network: VeranaNetwork; schemaId: number; title?: string; anonCredsIssuerId: string }

const VPR_SCHEMA_REF = /^vpr:verana:([^:/]+):cs:(\d+)$/

class UnauthorizedError extends Error {}

const resolutionError = (reference: AnonCredsReference, error: string | undefined) => {
  const message = `${reference.kind} ${reference.id} not resolved: ${error}`
  return error === 'unsupportedAnonCredsMethod' || error === 'notFound'
    ? new UnauthorizedError(message)
    : new Error(message)
}

const resolveAnonCreds = async (agent: MobileAgent, reference: AnonCredsReference) => {
  const options = { useLocalRecord: false }
  if (reference.kind === 'credentialDefinition') {
    const result = await agent.modules.anoncreds.getCredentialDefinition(reference.id, options)
    if (!result.credentialDefinition) throw resolutionError(reference, result.resolutionMetadata.error)
    return { issuerId: result.credentialDefinition.issuerId, metadata: result.credentialDefinitionMetadata }
  }
  const result = await agent.modules.anoncreds.getSchema(reference.id, options)
  if (!result.schema) throw resolutionError(reference, result.resolutionMetadata.error)
  return { issuerId: result.schema.issuerId, metadata: result.schemaMetadata }
}

const issuerIdOf = (issuer: unknown) => (isObject(issuer) ? issuer.id : issuer)

const deriveCredentialSchema = async (agent: MobileAgent, reference: AnonCredsReference): Promise<CredentialSchema> => {
  const { issuerId, metadata } = await resolveAnonCreds(agent, reference)
  const vtjscId = metadata.relatedJsonSchemaCredentialId
  if (typeof vtjscId !== 'string') throw new UnauthorizedError(`${reference.id} has no relatedJsonSchemaCredentialId`)

  const { status, body: vtjsc } = await fetchJson(vtjscId)
  if (status === 404) throw new UnauthorizedError(`VTJSC ${vtjscId} not found`)
  if (status !== 200 || !isObject(vtjsc)) throw new Error(`VTJSC ${vtjscId} fetch failed with HTTP ${status}`)
  const proof = vtjsc.proof
  if (!isObject(proof) || proof.type !== 'DataIntegrityProof' || proof.cryptosuite !== 'eddsa-jcs-2022') {
    throw new UnauthorizedError(`VTJSC ${vtjscId} is not secured with eddsa-jcs-2022`)
  }
  const vtjscIssuer = issuerIdOf(vtjsc.issuer)
  const signerDid = typeof proof.verificationMethod === 'string' ? proof.verificationMethod.split('#')[0] : undefined
  if (!signerDid || signerDid !== vtjscIssuer)
    throw new UnauthorizedError(`VTJSC ${vtjscId} is not signed by its issuer`)
  // Credo reports an unresolvable signer as an invalid proof, so resolve it first to tell an outage apart
  const signer = await agent.dids.resolve(signerDid)
  if (!signer.didDocument)
    throw new Error(`VTJSC signer ${signerDid} not resolved: ${signer.didResolutionMetadata.error}`)
  const verification = await agent.w3cDataIntegrity.verifySecuredDocument(vtjsc as W3cDataIntegritySecuredDocument)
  if (!verification.verified) throw new UnauthorizedError(`VTJSC ${vtjscId} proof is invalid`)

  const subject = vtjsc.credentialSubject
  const ref = isObject(subject) && isObject(subject.jsonSchema) ? subject.jsonSchema.$ref : undefined
  const match = typeof ref === 'string' ? VPR_SCHEMA_REF.exec(ref) : null
  const network = match ? VERANA_NETWORKS.find((candidate) => candidate.id === match[1]) : undefined
  if (!match || !network) throw new UnauthorizedError(`VTJSC ${vtjscId} references no configured network: ${ref}`)
  const schemaId = Number(match[2])

  const schemaResponse = await fetchJson(`${network.indexerUrl}/v4/credential-schema/get/${schemaId}`)
  const schemaBody = schemaResponse.body
  if (schemaResponse.status === 404 && isObject(schemaBody) && typeof schemaBody.error === 'string') {
    throw new UnauthorizedError(`Credential schema ${schemaId} not found`)
  }
  const schema = isObject(schemaBody) ? schemaBody.schema : undefined
  if (schemaResponse.status !== 200 || !isObject(schema) || typeof schema.ecosystem_id !== 'number') {
    throw new Error(`Credential schema ${schemaId} lookup failed with HTTP ${schemaResponse.status}`)
  }
  const ecosystemDid = await getEcosystemDid(network, schema.ecosystem_id)
  if (vtjscIssuer !== ecosystemDid) {
    throw new UnauthorizedError(`VTJSC ${vtjscId} is not issued by ecosystem ${ecosystemDid}`)
  }

  return {
    network,
    schemaId,
    title: typeof schema.title === 'string' ? schema.title : undefined,
    anonCredsIssuerId: issuerId,
  }
}

const isActiveParticipant = async (network: VeranaNetwork, did: string, role: AccreditationRole, schemaId: number) => {
  const query = new URLSearchParams({
    did,
    role,
    schema_id: String(schemaId),
    participant_state: 'ACTIVE',
    limit: '1',
  })
  const { status, body } = await fetchJson(`${network.indexerUrl}/v4/participant/list?${query.toString()}`)
  const participants = isObject(body) ? body.participants : undefined
  if (status !== 200 || !Array.isArray(participants)) {
    throw new Error(`Participant lookup on ${network.id} failed with HTTP ${status}`)
  }
  return participants.some(
    (participant) =>
      isObject(participant) &&
      participant.did === did &&
      participant.role === role &&
      Number(participant.schema_id) === schemaId &&
      participant.participant_state === 'ACTIVE'
  )
}

const checkReference = async (
  agent: MobileAgent,
  reference: AnonCredsReference,
  role: AccreditationRole,
  verifierDid?: string
): Promise<Accreditation> => {
  let title: string | undefined
  try {
    const schema = await deriveCredentialSchema(agent, reference)
    title = schema.title
    const did = role === 'ISSUER' ? schema.anonCredsIssuerId : verifierDid
    if (!did) throw new UnauthorizedError('No verifier DID to check')
    const authorized = await isActiveParticipant(schema.network, did, role, schema.schemaId)
    return { status: authorized ? 'authorized' : 'unauthorized', schemaTitles: title ? [title] : [] }
  } catch (error) {
    const status = error instanceof UnauthorizedError ? 'unauthorized' : 'unverified'
    logWarn(`Verana ${role} check of ${reference.id} is ${status}: ${String(error)}`)
    return { status, schemaTitles: title ? [title] : [] }
  }
}

export const checkIssuerAccreditation = (agent: MobileAgent, credentialDefinitionId: string) =>
  checkReference(agent, { kind: 'credentialDefinition', id: credentialDefinitionId }, 'ISSUER')

export const checkVerifierAccreditation = async (
  agent: MobileAgent,
  requestedGroups: AnonCredsReference[][],
  verifierDid: string | undefined
): Promise<Accreditation> => {
  if (!requestedGroups.length || requestedGroups.some((group) => !group.length) || !verifierDid) {
    return { status: 'unauthorized', schemaTitles: [] }
  }
  const references = new Map(requestedGroups.flat().map((reference) => [reference.id, reference]))
  const results = await Promise.all(
    [...references.values()].map((reference) => checkReference(agent, reference, 'VERIFIER', verifierDid))
  )
  const schemaTitles = [...new Set(results.flatMap((result) => result.schemaTitles))]
  const status = results.every((result) => result.status === 'authorized')
    ? 'authorized'
    : results.some((result) => result.status === 'unauthorized')
      ? 'unauthorized'
      : 'unverified'
  return { status, schemaTitles }
}
