import {
  AnonCredsProofFormat,
  AnonCredsSelectedCredentials,
  LegacyIndyProofFormat,
} from '@credo-ts/anoncreds'
import { ProofEventTypes, ProofFormatPayload, ProofState, ProofStateChangedEvent } from '@credo-ts/core'

import { MobileAgent } from './MobileAgent'
import { DidCommPresentationDisplayMetadata, setDidCommPresentationMetadata } from './RecordMetadata'

type SelectedCredentials = {
  [referent: string]: string
}

interface PresentProofOptions {
  agent: MobileAgent
  proofRecordId: string
  selectedCredentials: SelectedCredentials
}

export async function presentProof(options: PresentProofOptions) {
  const { agent, proofRecordId, selectedCredentials } = options

  // get format data to know where to populate the selection
  const { proofFormats } = await agent.proofs.getCredentialsForRequest({ proofRecordId })

  let anoncreds: AnonCredsSelectedCredentials | undefined, indy: AnonCredsSelectedCredentials | undefined

  const metadata: DidCommPresentationDisplayMetadata = { credentials: [] }

  // Search for referent among the attributes and the predicates, and build the selection object with
  // the match that corresponds to the selected credential id
  for (const referent in selectedCredentials) {
    const credentialId = selectedCredentials[referent]

    for (const attributeName in proofFormats.anoncreds?.attributes) {
      if (attributeName === referent) {
        if (!anoncreds) anoncreds = { attributes: {}, predicates: {}, selfAttestedAttributes: {} }
        // Ignoring TS errors as we have just defined the object
        // @ts-ignore
        anoncreds.attributes[attributeName] = proofFormats.anoncreds.attributes[attributeName].find(
          item => item.credentialId === credentialId,
        )
        metadata.credentials.push({ type: 'anoncreds', credentialId })
        break
      }
    }

    for (const predicateName in proofFormats.anoncreds?.predicates) {
      if (predicateName === referent) {
        if (!anoncreds) anoncreds = { attributes: {}, predicates: {}, selfAttestedAttributes: {} }
        // @ts-ignore
        anoncreds.predicates[predicateName] = proofFormats.anoncreds.predicates[predicateName].find(
          item => item.credentialId === credentialId,
        )
        metadata.credentials.push({ type: 'anoncreds', credentialId })
        break
      }
    }

    for (const attributeName in proofFormats.indy?.attributes) {
      if (attributeName === referent) {
        if (!indy) indy = { attributes: {}, predicates: {}, selfAttestedAttributes: {} }
        // @ts-ignore
        indy.attributes[attributeName] = proofFormats.indy.attributes[attributeName].find(
          item => item.credentialId === credentialId,
        )
        metadata.credentials.push({ type: 'indy', credentialId })
        break
      }
    }

    for (const predicateName in proofFormats.indy?.predicates) {
      if (predicateName === referent) {
        if (!indy) indy = { attributes: {}, predicates: {}, selfAttestedAttributes: {} }
        // @ts-ignore
        indy.predicates[predicateName] = proofFormats.indy.predicates[predicateName].find(
          item => item.credentialId === credentialId,
        )
        metadata.credentials.push({ type: 'indy', credentialId })
        break
      }
    }
  }

  const proofFormatPayload: ProofFormatPayload<
    (LegacyIndyProofFormat | AnonCredsProofFormat)[],
    'acceptRequest'
  > = {}
  if (anoncreds) proofFormatPayload.anoncreds = anoncreds
  if (indy) proofFormatPayload.indy = indy

  // Update record metadata
  const proofRecord = await agent.proofs.getById(proofRecordId)
  setDidCommPresentationMetadata(proofRecord, metadata)

  await agent.proofs.update(proofRecord)

  await agent.proofs.acceptRequest({ proofRecordId, proofFormats: proofFormatPayload })
}

export async function notifyNoCompatibleCredentials(options: { agent: MobileAgent; proofRecordId: string }) {
  await sendProblemReport({ ...options, description: 'e.req.no-compatible-credentials' })
}

export async function acceptProposal(options: { agent: MobileAgent; proofRecordId: string }) {
  const { agent, proofRecordId } = options
  await agent?.proofs.acceptProposal({ proofRecordId })
}

export async function sendProblemReport(options: {
  agent: MobileAgent
  proofRecordId: string
  description: string
}) {
  const { agent, proofRecordId, description } = options
  const proofRecord = await agent.proofs.getById(proofRecordId)
  proofRecord.state = ProofState.Abandoned
  await agent.proofs.update(proofRecord)
  agent.proofs.sendProblemReport({ proofRecordId, description })
  agent.events.emit<ProofStateChangedEvent>(agent.context, {
    type: ProofEventTypes.ProofStateChanged,
    payload: {
      proofRecord: proofRecord.clone(),
      previousState: null,
    },
  })
}
