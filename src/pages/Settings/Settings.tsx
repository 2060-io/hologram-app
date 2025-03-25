import { CacheModuleConfig } from '@credo-ts/core'
import { StackActions } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View, Image, TouchableOpacity, TouchableWithoutFeedback, Alert, ScrollView } from 'react-native'
import NotificationSetting from 'react-native-open-notification'

import { version } from '../../../package.json'
import { HomeMainTabParams } from '../HomeMain/HomeMainProps'

import getStyles from './styles'

import { ModalConfirmAction } from '@2060/components'
import { Avatar, Text, SvgIcon, OptionsList, FullScreenImage } from '@2060/components/common'
import { OptionProps } from '@2060/components/common/OptionsList/OptionsListProps'
import { useMobileAgent, useUserProfile } from '@2060/hooks/agent'
import { useConfig } from '@2060/hooks/providers/ConfigProvider'
import { useLocalRealm } from '@2060/hooks/providers/RealmProvider'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { deleteAllKeys } from '@2060/services/keys'
import { logError, dataUrl } from '@2060/utils'
import { toast } from '@2060/utils/toast'

interface Props extends StackScreenProps<HomeMainTabParams, 'Settings'> {}

const MAX_DELAY_BETWEEN_TOUCHES = 3000
const TIMES_TO_ENABLE_DEV_MODE = 7

const Settings = ({ navigation }: Props) => {
  const developerModeCounter = useRef(0)
  const lastTouch = useRef<number | undefined>(undefined)
  const [showConfirmationDeleteModal, setShowConfirmationDeleteModal] = useState(false)
  const [options, setOptions] = useState<Array<OptionProps>>([])
  const [showFullScreenImage, setShowFullScreenImage] = useState<boolean>(false)
  const { t } = useTranslation()
  const { agent, shutdownAgent, isConnectedToCloudAgent } = useMobileAgent()
  const { realm, closeRealm } = useLocalRealm()
  const { userProfileData } = useUserProfile()
  const { isDeveloperMode, changeDeveloperModeStatus } = useConfig()
  const theme = useTheme()
  const styles = getStyles(theme)
  const displayPicture = userProfileData?.displayPicture
  const displayName = userProfileData?.displayName
  const imgUrl = dataUrl(displayPicture?.mimeType, displayPicture?.base64)
  const defaultAvatar = Image.resolveAssetSource(require('@2060/assets/images/defaultUser.png')).uri
  const avatarUri = imgUrl || (displayName && displayName.length > 0 ? '' : defaultAvatar)

  const onAvatarImagePressed = () => setShowFullScreenImage(true)
  const closeFullScreenImage = () => setShowFullScreenImage(false)
  const hideConfirmationDeleteModal = () => setShowConfirmationDeleteModal(false)

  const confirmWalletDeletion = () => {
    const title = t('general.warning').toUpperCase()
    const message = t('settings.deleteWalletSecondMessage')
    Alert.alert(title, message, [
      { text: t('general.yesDelete'), style: 'default', onPress: deleteWallet },
      { text: t('general.cancel'), style: 'destructive', onPress: hideConfirmationDeleteModal },
    ])
  }

  const deleteWallet = async () => {
    if (!agent) return
    try {
      if (!isConnectedToCloudAgent) throw new Error('Not connected to Cloud Agent')
      // It will only proceed in case it is possible to send hang-up signal to mediator, in order to
      // let it delete all connection data (recipient keys, FCM token, etc.)
      const mediatorConnection = await agent.mediationRecipient.findDefaultMediatorConnection()
      if (mediatorConnection) await agent.connections.hangup({ connectionId: mediatorConnection.id })

      realm?.write(() => realm?.deleteAll())
      await agent.wallet.delete()

      // FIXME: Workaround to make sure cache is unloaded from memory
      const cache = agent.dependencyManager.resolve(CacheModuleConfig).cache

      // @ts-ignore
      // eslint-disable-next-line no-underscore-dangle
      cache._cache = undefined

      await shutdownAgent()
      await deleteAllKeys()
      closeRealm(true)
    } catch (error) {
      logError(`Error deleting wallet: ${error}`)
      toast({ type: 'error', message: t('settings.deleteWalletError') })
    } finally {
      hideConfirmationDeleteModal()
    }
  }

  useEffect(() => {
    updateOptions()
  }, [isDeveloperMode, theme.colors])

  const updateOptions = () => {
    const newOptions = [
      ...fixedOptions,
      ...(isDeveloperMode
        ? [
            {
              iconName: 'cloudDownload',
              text: t('settings.backup'),
              onPress: () => navigateTo('WalletBackup'),
              rightContent: () => optionRightContent(),
            },
            {
              iconName: 'developer',
              text: t('settings.developer'),
              onPress: () => navigateTo('Developer'),
              rightContent: () => optionRightContent(),
            },
          ]
        : []),
    ]
    setOptions(newOptions)
  }

  const optionRightContent = () => (
    <SvgIcon name="chevronForward" width={18} height={18} fill={theme.colors.tertiaryText} />
  )

  const fixedOptions = [
    {
      iconName: 'notifications',
      text: t('settings.notifications'),
      onPress: () => navigateTo('Notifications'),
      rightContent: () => optionRightContent(),
    },
    {
      iconName: 'users',
      text: t('settings.connections'),
      onPress: () => navigateTo('Connections'),
      rightContent: () => optionRightContent(),
    },
    {
      iconName: 'lock',
      text: t('settings.privacyAndDataUse'),
      onPress: () => navigateTo('Privacy'),
      rightContent: () => optionRightContent(),
    },
    {
      iconName: 'people',
      text: t('navigation.ParentalControl'),
      onPress: () => navigateTo('ParentalControl'),
      rightContent: () => optionRightContent(),
    },
    {
      iconName: 'trash',
      text: t('settings.deleteWallet'),
      onPress: () => setShowConfirmationDeleteModal(true),
    },
    {
      iconName: 'id',
      text: t('navigation.IdentityCredentialIssuers'),
      onPress: () => onNavigate('IdentityCredentialIssuers'),
    },
  ]

  const goToUserInvitation = () => navigation.dispatch(StackActions.push('UserInvitation'))
  const goToUserProfile = () => navigation.dispatch(StackActions.push('UserProfile'))

  const navigateTo = (screen: string) => {
    if (screen === 'Notifications') return NotificationSetting.open()
    navigation.dispatch(StackActions.push(screen))
  }

  const handleChangeHeaderOptions = () => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity style={styles.btnQr} onPress={goToUserInvitation} activeOpacity={0.6}>
          <SvgIcon name="qrcode" fill={theme.colors.primaryText} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity style={styles.btnEdit} activeOpacity={0.7} onPress={goToUserProfile}>
          <SvgIcon name="edit" fill={theme.colors.primaryText} />
        </TouchableOpacity>
      ),
    })
  }

  useLayoutEffect(handleChangeHeaderOptions, [theme.isDarkMode])

  const initializeDevModeVariables = () => {
    developerModeCounter.current = 0
    lastTouch.current = undefined
  }

  const handleDeveloperMode = () => {
    const now = new Date().getTime()
    const differenceBetweenNowAndLastTouch = lastTouch.current ? now - lastTouch.current : 0
    lastTouch.current = now
    const isValidTouch = differenceBetweenNowAndLastTouch <= MAX_DELAY_BETWEEN_TOUCHES
    if (isValidTouch) {
      developerModeCounter.current++
      if (developerModeCounter.current === TIMES_TO_ENABLE_DEV_MODE) {
        const newMessage = isDeveloperMode ? t('settings.devModeDisabled') : t('settings.devModeEnabled')
        toast({ type: 'success', message: newMessage })
        initializeDevModeVariables()
        changeDeveloperModeStatus()
      }
    } else {
      developerModeCounter.current = 1
    }
  }

  return (
    <View style={styles.container}>
      <FullScreenImage
        showFullScreenImage={showFullScreenImage}
        closeFullScreenImage={closeFullScreenImage}
        imageUri={avatarUri}
      />
      <ModalConfirmAction
        visible={showConfirmationDeleteModal}
        title={t('settings.deleteWalletTitle')}
        subTitle={t('settings.deleteWalletMessage')}
        confirmText={t('general.ok')}
        cancelText={t('general.cancel')}
        onClose={hideConfirmationDeleteModal}
        onConfirm={confirmWalletDeletion}
        onCancel={hideConfirmationDeleteModal}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.subContainer}
        contentContainerStyle={styles.scrollViewContentContainerStyle}
      >
        <TouchableWithoutFeedback onPress={handleDeveloperMode} style={styles.subContainer}>
          <View style={styles.subContainer}>
            <View style={styles.containerProfile}>
              <Avatar
                uri={avatarUri}
                label={userProfileData?.displayName}
                size="46%"
                onImagePressed={onAvatarImagePressed}
              />
              {userProfileData?.displayName && (
                <Text typography="EuclidCircularA-Medium" style={styles.displayName}>
                  {userProfileData?.displayName}
                </Text>
              )}
            </View>
            <OptionsList options={options} />
            <View style={styles.appVersionContainer}>
              <Text style={styles.appVersionText}>{version}</Text>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </View>
  )
}

export default Settings
