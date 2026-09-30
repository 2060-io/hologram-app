import type { AnonCredsProofRequestRestriction } from '@credo-ts/anoncreds'
import type { MobileAgent } from '@src/services/agent/MobileAgent'
import {
  type Accreditation,
  type AnonCredsReference,
  checkIssuerAccreditation,
  checkVerifierAccreditation,
} from '@src/services/verana/accreditation'
import { logWarn } from '@src/utils'
import { useCallback, useEffect, useState } from 'react'
import { useMobileAgent } from './agent/MobileAgentProvider'

const useAccreditationCheck = (check: (agent: MobileAgent) => Promise<Accreditation>, key: string) => {
  const { agent } = useMobileAgent()
  const [accreditation, setAccreditation] = useState<Accreditation>()
  const [isChecking, setIsChecking] = useState(true)

  const run = useCallback(async () => {
    if (!agent) return
    setIsChecking(true)
    try {
      setAccreditation(await check(agent))
    } catch (error) {
      logWarn(`Verana accreditation check for ${key} could not complete: ${String(error)}`)
      setAccreditation({ status: 'unverified', schemaTitles: [] })
    } finally {
      setIsChecking(false)
    }
  }, [agent, key])

  useEffect(() => {
    run()
  }, [run])

  return { accreditation, isChecking, retry: run }
}

export const useIssuerAccreditation = (credentialRecordId: string) =>
  useAccreditationCheck(async (agent) => {
    const formatData = await agent.didcomm.credentials.getFormatData(credentialRecordId)
    const credentialDefinitionId = formatData.offer?.anoncreds?.cred_def_id ?? formatData.offer?.indy?.cred_def_id
    if (!credentialDefinitionId) return { status: 'unauthorized', schemaTitles: [] }
    return checkIssuerAccreditation(agent, credentialDefinitionId)
  }, credentialRecordId)

const referencesOf = (restrictions: AnonCredsProofRequestRestriction[] = []): AnonCredsReference[] =>
  restrictions.flatMap((restriction): AnonCredsReference[] => {
    if (restriction.cred_def_id) return [{ kind: 'credentialDefinition', id: restriction.cred_def_id }]
    if (restriction.schema_id) return [{ kind: 'schema', id: restriction.schema_id }]
    return []
  })

export const useVerifierAccreditation = (proofRecordId: string, verifierDid: string | undefined) =>
  useAccreditationCheck(async (agent) => {
    const formatData = await agent.didcomm.proofs.getFormatData(proofRecordId)
    const request = formatData.request?.anoncreds ?? formatData.request?.indy
    if (!request) return { status: 'unauthorized', schemaTitles: [] }
    const groups = [
      ...Object.values(request.requested_attributes ?? {}),
      ...Object.values(request.requested_predicates ?? {}),
    ].map((requested) => referencesOf(requested.restrictions))
    return checkVerifierAccreditation(agent, groups, verifierDid)
  }, `${proofRecordId}:${verifierDid}`)
