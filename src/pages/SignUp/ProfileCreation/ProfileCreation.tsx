import { PictureData } from '@2060.io/credo-ts-didcomm-user-profile'
import { CommonActions } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, View, SafeAreaView } from 'react-native'
import Config from 'react-native-config'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

import getStyles from './styles'

import AppLogo from '@2060/assets/icons/AppLogo'
import { UserProfileForm } from '@2060/components'
import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { ModalLoading, MainButton, Text } from '@2060/components/common'
import { useSignUp, SignUpState, useWallet } from '@2060/hooks'
import { useUserProfile } from '@2060/hooks/agent'
import { useConfig } from '@2060/hooks/providers/ConfigProvider'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { logError } from '@2060/utils'
import { requestNotificationPermissionUser } from '@2060/utils/pushNotificationsUtils'
import { toast } from '@2060/utils/toast'

type Props = {
  navigation: StackNavigationProp<NavigationStackParams, 'ProfileCreation'>
}

const ProfileCreation = ({ navigation }: Props) => {
  const { t } = useTranslation()
  const { createNewWallet } = useWallet()
  const [isRegistering, setIsRegistering] = useState(false)
  const { setUserProfileData } = useUserProfile()
  const { devEnvs, isDeveloperMode } = useConfig()
  const [displayName, setDisplayName] = useState('')
  const [displayPicture, setDisplayPicture] = useState<PictureData | undefined>()
  const { signUpState, startSignUp, updateNotificationInfo } = useSignUp({
    defaultServicePublicDid: Config.DEFAULT_SERVICE_PUBLIC_DID as string,
    defaultServiceAlias: Config.DEFAULT_SERVICE_ALIAS as string,
    cloudAgentPublicDid: devEnvs.CLOUD_AGENT_PUBLIC_DID as string,
  })

  const theme = useTheme()
  const styles = getStyles(theme)
  const disableGetStartedBtn = displayName.trim() === ''

  const requestNotificationPermissions = () => {
    const message = t('signUp.requestPermissionsNotification')
    Alert.alert('Hologram', message, [
      { text: t('signUp.dontAllow'), style: 'destructive' },
      {
        text: t('signUp.allow'),
        style: 'default',
        onPress: async () => {
          const allowed = await requestNotificationPermissionUser()
          if (allowed) await updateNotificationInfo()
        },
      },
    ])
  }

  const navigateTo = () => {
    const screenToNavigate = isDeveloperMode ? 'IdentityCredentialIssuers' : 'Home'
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: screenToNavigate }] }))
  }

  const saveUserProfileData = () => {
    setUserProfileData?.({ displayName: displayName.trim(), displayPicture })
  }

  const getStart = () => {
    requestNotificationPermissions()
    saveUserProfileData()
    navigateTo()
  }

  const handleLogStartError = (error: Error) => {
    logError('Error startSignUp', error?.message)
    toast({ type: 'error', message: t('signUp.anErrorHasOccurred'), duration: 5000 })
  }

  const signUp = async () => {
    setIsRegistering(true)
    try {
      await createNewWallet()
      await startSignUp()
    } catch (error) {
      if (error instanceof Error) handleLogStartError(error)
    } finally {
      setIsRegistering(false)
    }
  }

  const handleRegistrationStatusUpdate = () => {
    if (signUpState === SignUpState.Init) return
    if (signUpState === SignUpState.AgentCreated) {
      getStart()
    }
  }

  const handleChangeHeaderOptions = () => navigation.setOptions({ headerTitle: () => <></> })

  useEffect(handleChangeHeaderOptions, [displayName])
  useEffect(handleRegistrationStatusUpdate, [signUpState])

  return (
    <SafeAreaView style={styles.container}>
      <ModalLoading visible={isRegistering} />
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        extraScrollHeight={70}
      >
        <View style={styles.container}>
          <AppLogo style={styles.appLogoContainer} />
          <Text typography="EuclidCircularA-Bold" style={styles.title}>
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
