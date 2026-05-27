import { AnonCredsDidCommProofFormat, LegacyIndyDidCommProofFormat } from '@credo-ts/anoncreds'
import { DidCommProofFormatPayload } from '@credo-ts/didcomm'
import { ProofSendProblemReportDescription } from '@src/hooks/agent/actions/types'

import { MobileAgent } from './MobileAgent'

type AcceptProofFormatPayload = DidCommProofFormatPayload<
  (LegacyIndyDidCommProofFormat | AnonCredsDidCommProofFormat)[],
  'acceptRequest'
>

export type AcceptProofRequestResult = 'presentation' | 'problem-report'

export async function acceptProofRequestOrReportNoCompatible(options: {
  agent: MobileAgent
  proofRecordId: string
  proofFormats?: AcceptProofFormatPayload
}): Promise<AcceptProofRequestResult> {
  const { agent, proofRecordId } = options

  let proofFormats = options.proofFormats
  if (!proofFormats) {
    try {
      const selected = await agent.didcomm.proofs.selectCredentialsForRequest({
        proofExchangeRecordId: proofRecordId,
        proofFormats: { anoncreds: { filterByNonRevocationRequirements: true } },
      })
      proofFormats = { anoncreds: selected.proofFormats.anoncreds }
    } catch {
      await agent.didcomm.proofs.declineRequest({
        proofExchangeRecordId: proofRecordId,
        sendProblemReport: true,
        problemReportDescription: ProofSendProblemReportDescription.NoCompatibleCredentials,
      })
      return 'problem-report'
    }
  }

  await agent.didcomm.proofs.acceptRequest({
    proofExchangeRecordId: proofRecordId,
    proofFormats,
  })
  return 'presentation'
}
