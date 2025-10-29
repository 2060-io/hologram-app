import { UserProfileData } from '@2060.io/credo-ts-didcomm-user-profile'
import React, { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View, TouchableOpacity, Image } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import Modal from 'react-native-modal'
import { SafeAreaView } from 'react-native-safe-area-context'

import Camera from '../Camera'
import { MediaCaptured } from '../Camera/Props'

import getStyles from './styles'

import defaultAvatar from '@2060/assets/images/defaultUser.png'
import { Text, TextInput, SvgIcon, Avatar } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { getGlobalStyles } from '@2060/styles'
import { dataUrl, log } from '@2060/utils'
import { deleteFile, readFile } from '@2060/utils/RNFS'
import { getMediaInfo } from '@2060/utils/mediaFileUtils'
import { handleCameraPermission } from '@2060/utils/permissions'

type Props = {
  displayPicture: UserProfileData['displayPicture']
  displayName: string | undefined
  onHandleChangePicture(pictureData: UserProfileData['displayPicture']): void
  onHandleChangeName(value: string): void
}

const UserProfileForm: React.FC<Props> = props => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const globalStyles = getGlobalStyles(theme)
  const { displayPicture, displayName, onHandleChangePicture, onHandleChangeName } = props
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const imgUrl = displayPicture ? dataUrl(displayPicture.mimeType, displayPicture.base64) : null
  const avatarUri = imgUrl || Image.resolveAssetSource(defaultAvatar).uri

  const handleOpenCamera = async () => {
    const cameraPermission = await handleCameraPermission()
    if (!cameraPermission) return
    setIsCameraOpen(true)
  }

  const closeCamera = () => {
    setIsCameraOpen(false)
  }

  const onPhoto = async (media: MediaCaptured) => {
    try {
      closeCamera()
      const base64 = await readFile(media.path, 'base64')
      const { mimeType } = await getMediaInfo(media.path)
      onHandleChangePicture({ mimeType, base64 })
    } catch (e) {
      log('Error uploading user profile photo', e)
    } finally {
      deleteFile(media.path)
    }
  }

  return (
    <View>
      <Modal isVisible={isCameraOpen} statusBarTranslucent style={styles.modalCamera}>
        <SafeAreaView
          style={[styles.container, { backgroundColor: globalStyles.headerStyle.backgroundColor }]}
        >
          <GestureHandlerRootView style={styles.container}>
            <Camera isActive onMedia={onPhoto} closeCamera={closeCamera} isVideoMode={false} />
          </GestureHandlerRootView>
        </SafeAreaView>
      </Modal>
      <Text style={styles.textInputDescription}>{t('signUp.textInputNicknameDescription')}</Text>
      <View style={styles.containerRootAvatar}>
        {imgUrl?.length && (
          <TouchableOpacity
            style={styles.btnClose}
            onPress={() => onHandleChangePicture(null)}
            activeOpacity={0.6}
          >
            <SvgIcon name="close" fill={theme.colors.lightGrey} />
          </TouchableOpacity>
        )}
        <Avatar uri={avatarUri} label={displayName} size="46%" />
      </View>
      <View style={styles.containerOption}>
        <TouchableOpacity onPress={handleOpenCamera} style={styles.containerOptionIcon} activeOpacity={0.7}>
          <SvgIcon name="camera" width={30} height={30} fill={theme.colors.primaryText} />
        </TouchableOpacity>
        <Text fontFamily="EuclidCircularA-Medium" style={styles.optionText}>
          {t('signUp.camera')}
        </Text>
      </View>
      <TextInput
        value={displayName}
        style={styles.textInput}
        onChangeText={onHandleChangeName}
        placeholder={t('signUp.chooseNickname')}
        placeholderTextColor={theme.colors.secondaryText}
        autoCapitalize="words"
      />
    </View>
  )
}

export default memo(UserProfileForm)
