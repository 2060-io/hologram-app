import { StackNavigationProp } from '@react-navigation/stack'
import React, { useEffect, useCallback, useTransition } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { SafeAreaView } from 'react-native-safe-area-context'

import getStyles from './styles'

import AppLogo from '@2060/assets/icons/AppLogo'
import { UserProfileForm } from '@2060/components'
import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { ModalLoading, MainButton, Text } from '@2060/components/common'
import { useSignUp, useWallet } from '@2060/hooks'
import { AgentActionType, useMobileAgent, useAgentActionQueue } from '@2060/hooks/agent'
import { SavePushNotificationDeviceInfoParameters } from '@2060/hooks/agent/actions/types'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { createAndStoreEncryptedKey, KeyChainService } from '@2060/services/keys'
import { logError } from '@2060/utils'
import { deleteDir, makeDirectory, mediaDirectoryPath, walletDirectoryPath } from '@2060/utils/RNFS'
import { getFcmDeviceToken, requestNotificationsPermission } from '@2060/utils/pushNotificationsUtils'
import { toast } from '@2060/utils/toast'

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
  const { startSignUp, displayName, setDisplayName, displayPicture, setDisplayPicture } = useSignUp()
  const disableGetStartedBtn = displayName.trim() === ''

  useEffect(() => {
    navigation.setOptions({ headerTitle: () => <></> })
  }, [])

  const createNewWallet = useCallback(async () => {
    if (!agent) throw new Error('Agent not defined')
    if (!agent.isInitialized) {
      // Make sure wallet and media directories are clean
      await deleteDir(walletDirectoryPath)
      await deleteDir(mediaDirectoryPath)

      await makeDirectory(walletDirectoryPath)
      await makeDirectory(mediaDirectoryPath)

      const key = await createAndStoreEncryptedKey(KeyChainService.AfjWallet)

      // Reconfigure askar store config with this new key
      agent.modules.askar.config.store.key = key

      await agent.modules.askar.provisionStore()
    }
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
        <KeyboardAwareScrollView
          showsVerticalScrollIndicator={false}
          enableOnAndroid={true}
          extraScrollHeight={70}
        >
          <View style={styles.container}>
            <AppLogo style={styles.appLogoContainer} />
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
