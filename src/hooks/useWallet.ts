import { useCallback, useState } from 'react'

import { KeyChainService, createAndStoreKey, retrieveKey } from '../services/keys'
import { deleteDir, makeDirectory, mediaDirectoryPath, walletDirectoryPath } from '../utils/RNFS'

import { useMobileAgent } from './agent'
import { useLocalRealm } from './providers/RealmProvider'

import { log } from '@2060/utils'

export const useWallet = () => {
  const [openingWallet, setOpeningWallet] = useState(true)
  const [creatingNewWallet, setCreatingNewWallet] = useState(false)
  const { agent, initMobileAgent } = useMobileAgent()
  const { openRealm } = useLocalRealm()

  const storage = { type: 'sqlite', config: { path: `${walletDirectoryPath}/afj.sqlite` } }
  const getWalletConfig = (storeKey: string) => ({ id: 'afj', key: storeKey, storage })

  const openWallet = useCallback(async () => {
    if (!agent || agent.isInitialized) return
    try {
      const key = await retrieveKey(KeyChainService.AfjWallet)
      if (!key) throw new Error('No wallet key stored')

      await agent.wallet.open(getWalletConfig(key))
      // If wallet could be opened, initialize agent to see if it is registered
      await initMobileAgent()
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

        const key = await createAndStoreKey(KeyChainService.AfjWallet)
        await makeDirectory(mediaDirectoryPath)
        await makeDirectory(walletDirectoryPath)

        await agent.wallet.createAndOpen(getWalletConfig(key))
        await initMobileAgent()
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
    isWalletOpen: agent?.isInitialized,
  }
}
