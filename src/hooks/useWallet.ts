import { useCallback, useState } from 'react'

import { KeyChainService, createAndStoreEncryptedKey } from '../services/keys'
import { deleteDir, makeDirectory, mediaDirectoryPath, walletDirectoryPath } from '../utils/RNFS'

import { useMobileAgent } from './agent'
import { useLocalRealm } from './providers/RealmProvider'

import { log } from '@2060/utils'

export const useWallet = () => {
  const [openingWallet, setOpeningWallet] = useState(true)
  const [creatingNewWallet, setCreatingNewWallet] = useState(false)
  const { agent, openAndInitMobileAgent } = useMobileAgent()
  const { openRealm } = useLocalRealm()

  const storage = { type: 'sqlite', config: { path: `${walletDirectoryPath}/afj.sqlite` } }
  const getWalletConfig = (storeKey: string) => ({ id: 'afj', key: storeKey, storage })

  const openWallet = useCallback(async () => {
    if (!agent) return
    try {
      await openAndInitMobileAgent()
      await openRealm()
    } catch (error) {
      log(`wallet opening error: ${error}`)
    } finally {
      setOpeningWallet(false)
    }
  }, [agent])

  const createNewWallet = useCallback(async () => {
    if (!agent) throw new Error('Agent not defined')

    if (!agent.isInitialized) {
      setCreatingNewWallet(true)
      try {
        // Make sure wallet and media directories are clean
        await deleteDir(walletDirectoryPath)
        await deleteDir(mediaDirectoryPath)

        await makeDirectory(walletDirectoryPath)
        await makeDirectory(mediaDirectoryPath)

        const key = await createAndStoreEncryptedKey(KeyChainService.AfjWallet)
        await agent.wallet.create(getWalletConfig(key))
        await openAndInitMobileAgent()
        await openRealm()
      } finally {
        setCreatingNewWallet(false)
      }
    }
  }, [agent])

  return {
    openingWallet,
    creatingNewWallet,
    openWallet,
    createNewWallet,
  }
}
