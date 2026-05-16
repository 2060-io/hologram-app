import { StackNavigationProp } from '@react-navigation/stack'
import AppLogo from '@src/assets/icons/AppLogo'
import { UserProfileForm } from '@src/components'
import { MainButton, ModalLoading, Text } from '@src/components/common'
import { NavigationStackParams } from '@src/components/Navigation/NavigationProps'
import { useSignUp, useWallet } from '@src/hooks'
import { AgentActionType, useAgentActionQueue, useMobileAgent } from '@src/hooks/agent'
import { SavePushNotificationDeviceInfoParameters } from '@src/hooks/agent/actions/types'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { createAndStoreEncryptedKey, KeyChainService } from '@src/services/keys'
import { logError } from '@src/utils'
import { getFcmDeviceToken, requestNotificationsPermission } from '@src/utils/pushNotificationsUtils'
import { deleteDir, makeDirectory, mediaDirectoryPath, walletDirectoryPath } from '@src/utils/RNFS'
import { toast } from '@src/utils/toast'
import React, { useCallback, useEffect, useTransition } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { SafeAreaView } from 'react-native-safe-area-context'
import getStyles from './styles'

type Props = {
  navigation: StackNavigationProp<NavigationStackParams, 'ProfileCreation'>
}

const ProfileCreation = ({ navigation }: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { agent } = useMobileAgent()
  const { openWallet } = useWallet()
  const { addAgentActionToQueue } = useAgentActionQueue()
  const [isRegistering, startRegisterTransition] = useTransition()
  const {
    startSignUp,
    tryToConnectToDefaultService,
    fetchDefaultConnectedServiceInfo,
    displayName,
    setDisplayName,
    displayPicture,
    setDisplayPicture,
  } = useSignUp()
  const disableGetStartedBtn = displayName.trim() === ''

  useEffect(() => {
    navigation.setOptions({ headerTitle: () => <></> })
  }, [])

  const createNewWallet = useCallback(async () => {
    if (!agent) throw new Error('Agent not defined')
    if (agent.isInitialized) {
      logError('createNewWallet: Agent already initialized!')
      return
    }
    // Make sure wallet and media directories are clean
    await deleteDir(walletDirectoryPath)
    await deleteDir(mediaDirectoryPath)

    await makeDirectory(walletDirectoryPath)
    await makeDirectory(mediaDirectoryPath)

    const key = await createAndStoreEncryptedKey(KeyChainService.AfjWallet)

    // Reconfigure askar store config with this new key
    agent.modules.askar.config.store.key = key

    await agent.modules.askar.provisionStore()
  }, [agent])

  const updateNotificationInfo = useCallback(async () => {
    if (!agent) return

    const connection = await agent.didcomm.mediationRecipient.findDefaultMediatorConnection()
    if (!connection) return
    const deviceToken = await getFcmDeviceToken()
    const parameters: SavePushNotificationDeviceInfoParameters = {
      connectionId: connection.id,
      deviceToken,
    }
    addAgentActionToQueue({ type: AgentActionType.SavePushNotificationDeviceInfo, parameters })
  }, [agent])

  const handleNotificationsPermission = async () => {
    const areNotificationsAllowed = await requestNotificationsPermission()
    if (areNotificationsAllowed) await updateNotificationInfo()
  }

  const signUp = async () => {
    startRegisterTransition(async () => {
      try {
        await createNewWallet()
        await openWallet()
        await startSignUp()
        const connectedToDefaultService = await tryToConnectToDefaultService()
        if (connectedToDefaultService) fetchDefaultConnectedServiceInfo()
        await handleNotificationsPermission()
      } catch (error) {
        toast({ type: 'error', message: t('signUp.anErrorHasOccurred'), duration: 5000 })
        logError('Error startSignUp', error)
      }
    })
  }

  return (
    <>
      <SafeAreaView style={styles.container} edges={['bottom', 'top']}>
        <KeyboardAwareScrollView showsVerticalScrollIndicator={false} enableOnAndroid={true} extraScrollHeight={70}>
          <View style={styles.container}>
            <AppLogo />
            <Text fontFamily="EuclidCircularA-Bold" style={styles.title}>
              {t('signUp.welcomeTitle')}
            </Text>
            <UserProfileForm
              displayName={displayName}
              displayPicture={displayPicture}
              onHandleChangeName={setDisplayName}
              onHandleChangePicture={setDisplayPicture}
            />
            <MainButton
              text={t('signUp.getStarted')}
              activeOpacity={0.6}
              disabled={disableGetStartedBtn}
              onPress={signUp}
              style={[styles.containerBtn, disableGetStartedBtn && styles.btnDisabled]}
            />
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
      <ModalLoading visible={isRegistering} />
    </>
  )
}

export default ProfileCreation
