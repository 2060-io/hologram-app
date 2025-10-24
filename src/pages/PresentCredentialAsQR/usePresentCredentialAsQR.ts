import { AnonCredsPresentationPreviewAttribute } from '@credo-ts/anoncreds'
import { useEffect } from 'react'

import { useCredentials, useMobileAgent } from '@2060/hooks/agent'
import { createInvitation } from '@2060/services/agent'
import { createProofProposal } from '@2060/services/agent/proofs'
import { log } from '@2060/utils'

export const usePresentCredentialAsQR = ({
  credentialRecordId,
  attributesToPresent,
}: {
  credentialRecordId: string
  attributesToPresent: string[]
}) => {
  const { agent } = useMobileAgent()
  const { getCredentialById } = useCredentials()

  useEffect(() => {
    const startFlow = async () => {
      if (!agent) return
      const credentialRecord = getCredentialById(credentialRecordId)
      if (!credentialRecord) return
      const credentialDefinitionId = credentialRecord.getTag('anonCredsCredentialDefinitionId') as string
      if (!credentialDefinitionId) return
      const attributes: AnonCredsPresentationPreviewAttribute[] = attributesToPresent.map(attribute => ({
        name: attribute,
        credentialDefinitionId,
      }))
      const message = await createProofProposal({ agent, attributes })
      log('message', message)
      const invitation = await createInvitation(agent, {
        multiUseInvitation: false,
        messages: [message.message],
      })
      log('invitation', invitation)
    }
    startFlow()
  }, [agent])
}
