import { useCallback, useState } from 'react'

import { useMobileAgent } from './agent'
import { useLocalRealm } from './providers/RealmProvider'

import { log } from '@2060/utils'

export const useWallet = () => {
  const [openingWallet, setOpeningWallet] = useState(false)
  const { agent, openAndInitMobileAgent } = useMobileAgent()
  const { openRealm } = useLocalRealm()

  const openWallet = useCallback(async () => {
    if (!agent) return
    try {
      setOpeningWallet(true)
      await openAndInitMobileAgent()
      await openRealm()
    } catch (error) {
      log(`wallet opening error: ${error}`)
    } finally {
      setOpeningWallet(false)
    }
  }, [agent])

  return {
    openingWallet,
    openWallet,
  }
}
