import { useCallback, useState } from 'react'

import { useMobileAgent } from './agent'
import { useLocalRealm } from './providers/RealmProvider'

import { logWarn } from '@2060/utils'
import { existsFile, walletPath } from '@2060/utils/RNFS'

export const useWallet = (isOpeningWalletDefaultValue = false) => {
  const [openingWallet, setOpeningWallet] = useState(isOpeningWalletDefaultValue)
  const { agent, openAndInitMobileAgent } = useMobileAgent()
  const { openRealm } = useLocalRealm()

  const openWallet = useCallback(async () => {
    if (!agent) return
    try {
      const canOpenWallet = await existsFile(walletPath)
      if (!canOpenWallet) throw new Error('No wallet file found, so wallet can not be opened')
      await openAndInitMobileAgent()
      await openRealm()
    } catch (error) {
      logWarn(`wallet opening error: ${error}`)
    } finally {
      setOpeningWallet(false)
    }
  }, [agent])

  return {
    openingWallet,
    openWallet,
  }
}
