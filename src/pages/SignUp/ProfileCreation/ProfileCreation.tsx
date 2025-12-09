import { UserProfileData } from '@2060.io/credo-ts-didcomm-user-profile'
import { CommonActions } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import React, { useState, useEffect, useCallback, useTransition } from 'react'
import { useTranslation } from 'react-i18next'
import { View, Platform } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { SafeAreaView } from 'react-native-safe-area-context'

import getStyles from './styles'

import AppLogo from '@2060/assets/icons/AppLogo'
import { UserProfileForm } from '@2060/components'
import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { ModalLoading, MainButton, Text } from '@2060/components/common'
import { useSignUp, SignUpState, useWallet } from '@2060/hooks'
import { useMobileAgent, useUserProfile } from '@2060/hooks/agent'
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
  const { agent } = useMobileAgent()
  const { openWallet } = useWallet()
  const [isRegistering, startRegisterTransition] = useTransition()
  const { updateUserProfileData } = useUserProfile()
  const [displayName, setDisplayName] = useState('')
  const [displayPicture, setDisplayPicture] = useState<UserProfileData['displayPicture']>()
  const { signUpState, startSignUp } = useSignUp()
  const theme = useTheme()
  const styles = getStyles(theme)
  const disableGetStartedBtn = displayName.trim() === ''

  useEffect(() => {
    navigation.setOptions({ headerTitle: () => <></> })
  }, [])

  useEffect(() => {
    const handleRegistrationStatusUpdate = async () => {
      if (signUpState === SignUpState.AgentCreated) {
        updateUserProfileData({ displayName: displayName.trim(), displayPicture })
        goHome()
      }
    }
    handleRegistrationStatusUpdate()
  }, [signUpState])

  const goHome = () => {
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Home' }] }))
  }

  const createNewWallet = useCallback(async () => {
    if (!agent) throw new Error('Agent not defined')
    if (!agent.isInitialized) {
      // Make sure wallet and media directories are clean
      await deleteDir(walletDirectoryPath)
      await deleteDir(mediaDirectoryPath)

      await makeDirectory(walletDirectoryPath)
      await makeDirectory(mediaDirectoryPath)

      const storage = { type: 'sqlite', config: { path: `${walletDirectoryPath}/afj.sqlite` } }
      const getWalletConfig = (storeKey: string) => ({ id: 'afj', key: storeKey, storage })

      const key = await createAndStoreEncryptedKey(KeyChainService.AfjWallet)
      await agent.wallet.create(getWalletConfig(key))
    }
  }, [agent])

  const updateNotificationInfo = useCallback(async () => {
    if (!agent) return

    const connection = await agent.mediationRecipient.findDefaultMediatorConnection()
    if (!connection) return

    const deviceToken = await getFcmDeviceToken()
    await agent.modules.pushNotifications.setDeviceInfo(connection.id, {
      deviceToken,
      devicePlatform: Platform.OS,
    })
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ModalLoading visible={isRegistering} />
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
  )
}

export default ProfileCreation
