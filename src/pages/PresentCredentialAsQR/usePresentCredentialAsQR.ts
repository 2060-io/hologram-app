import { useEffect } from 'react'

import { useMobileAgent } from '@2060/hooks/agent'
import { createProofProposal } from '@2060/services/agent/proofs'
import { log } from '@2060/utils'

export const usePresentCredentialAsQR = ({ attributesToPresent }: { attributesToPresent: string[] }) => {
  const { agent } = useMobileAgent()

  useEffect(() => {
    const startFlow = async () => {
      if (!agent) return
      const attributes = attributesToPresent.map(attribute => ({
        name: attribute,
      }))
      const anoncreds = { attributes }
      const message = await createProofProposal({ agent, anoncreds })
      log('message', message)
    }
    startFlow()
  }, [agent])
}
