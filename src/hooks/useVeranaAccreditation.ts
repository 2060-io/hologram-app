import { MobileAgent } from '@src/services/agent'
import {
  registryBaseUrlFor,
  resolveVeranaAccreditation,
  VeranaAccreditation,
  VeranaPermissionRole,
} from '@src/services/verana'
import { logError } from '@src/utils'
import { useEffect, useState } from 'react'
import { useMobileAgent } from './agent/MobileAgentProvider'

const anonCredsIdFromCredentialOffer = async (agent: MobileAgent, credentialRecordId: string) => {
  const formatData = await agent.didcomm.credentials.getFormatData(credentialRecordId)
  const offer = formatData.offer?.anoncreds ?? formatData.offer?.indy
  return offer?.cred_def_id ?? offer?.schema_id
}

const anonCredsIdFromProofRequest = async (agent: MobileAgent, proofRecordId: string) => {
  const formatData = await agent.didcomm.proofs.getFormatData(proofRecordId)
  const request = formatData.request?.anoncreds ?? formatData.request?.indy
  if (!request) return undefined

  const requested = [
    ...Object.values(request.requested_attributes ?? {}),
    ...Object.values(request.requested_predicates ?? {}),
  ]
  for (const item of requested) {
    for (const restriction of item.restrictions ?? []) {
      const id = restriction.cred_def_id ?? restriction.schema_id
      if (id) return id
    }
  }
  return undefined
}

/**
 * Q2/Q3: is this DID an authorized issuer of what it offers, or an authorized verifier of what it
 * asks for? `isChecking` starts true so the consent screen never renders Accept before the answer.
 */
const useAccreditation = (options: {
  did?: string
  role: VeranaPermissionRole
  resolveAnonCredsId: (agent: MobileAgent) => Promise<string | undefined>
  recordId: string
}) => {
  const { agent } = useMobileAgent()
  const { did, role, recordId } = options
  const [accreditation, setAccreditation] = useState<VeranaAccreditation>()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      // No DID means there is nothing to ask the registry about, which is could-not-determine and
      // must not leave the gate stuck closed. A missing agent is still start-up, so it stays closed.
      if (!did) {
        setIsChecking(false)
        return
      }
      if (!agent) return
      setIsChecking(true)
      try {
        const anonCredsId = await options.resolveAnonCredsId(agent)
        const result = anonCredsId
          ? await resolveVeranaAccreditation({ did, role, anonCredsId, registryBaseUrlFor })
          : undefined
        if (!cancelled) setAccreditation(result)
      } catch (error) {
        logError(`Error checking Verana ${role} accreditation for ${did}`, error)
        if (!cancelled) setAccreditation(undefined)
      } finally {
        if (!cancelled) setIsChecking(false)
      }
    }

    check()
    return () => {
      cancelled = true
    }
  }, [agent, did, role, recordId])

  return { accreditation, isChecking }
}

export const useVeranaIssuerAccreditation = (options: { did?: string; credentialRecordId: string }) =>
  useAccreditation({
    did: options.did,
    role: 'ISSUER',
    recordId: options.credentialRecordId,
    resolveAnonCredsId: (agent) => anonCredsIdFromCredentialOffer(agent, options.credentialRecordId),
  })

export const useVeranaVerifierAccreditation = (options: { did?: string; proofRecordId: string }) =>
  useAccreditation({
    did: options.did,
    role: 'VERIFIER',
    recordId: options.proofRecordId,
    resolveAnonCredsId: (agent) => anonCredsIdFromProofRequest(agent, options.proofRecordId),
  })
