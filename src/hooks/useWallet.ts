import { useCallback, useState } from 'react'

import { useMobileAgent } from './agent'
import { useLocalRealm } from './providers/RealmProvider'

import { KeyChainService, retrieveEncryptedKey } from '@src/services/keys'
import { logWarn } from '@src/utils'

export const useWallet = (isOpeningWalletDefaultValue = false) => {
  const [openingWallet, setOpeningWallet] = useState(isOpeningWalletDefaultValue)
  const { agent, openAndInitMobileAgent } = useMobileAgent()
  const { openRealm } = useLocalRealm()

  const checkIfCanOpenWallet = async () => {
    const walletKey = await retrieveEncryptedKey(KeyChainService.AfjWallet)
    return walletKey
  }

  const openWallet = useCallback(async () => {
    if (!agent) return
    try {
      const canOpenWallet = await checkIfCanOpenWallet()
      if (!canOpenWallet) throw new Error('No wallet key stored, so wallet can not be opened')
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
