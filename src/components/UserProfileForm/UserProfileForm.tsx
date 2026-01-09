import { UserProfileData } from '@2060.io/credo-ts-didcomm-user-profile'
import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { View, TouchableOpacity, Image } from 'react-native'

import getStyles from './styles'

import defaultAvatar from '@2060/assets/images/defaultUser.png'
import { Text, TextInput, SvgIcon, Avatar } from '@2060/components/common'
import { useImageCropPicker, ImageOrVideo } from '@2060/hooks'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { dataUrl } from '@2060/utils'

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
  const { takePhotoOrVideo, takePhotoOrVideoFromGallery } = useImageCropPicker()
  const { displayPicture, displayName, onHandleChangePicture, onHandleChangeName } = props
  const imgUrl = displayPicture ? dataUrl(displayPicture.mimeType, displayPicture.base64) : null
  const avatarUri = imgUrl ?? Image.resolveAssetSource(defaultAvatar).uri

  const onChangeAvatarInfo = (info: ImageOrVideo) => {
    if (info.data) onHandleChangePicture({ mimeType: info.mime, base64: info.data })
  }

  const onTakePhotoOrGallery = (type: 'Gallery' | 'Camera') => {
    return {
      Camera: async () => await takePhotoOrVideo(onChangeAvatarInfo),
      Gallery: async () => await takePhotoOrVideoFromGallery(onChangeAvatarInfo),
    }[type]()
  }

  return (
    <View>
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
      <View style={styles.containerOptions}>
        <View style={styles.containerOption}>
          <TouchableOpacity
            onPress={() => onTakePhotoOrGallery('Camera')}
            style={styles.containerOptionIcon}
            activeOpacity={0.7}
          >
            <SvgIcon name="camera" width={30} height={30} fill={theme.colors.primaryText} />
          </TouchableOpacity>
          <Text fontFamily="EuclidCircularA-Medium" style={styles.optionText}>
            {t('signUp.camera')}
          </Text>
        </View>
        <View style={styles.containerOption}>
          <TouchableOpacity
            onPress={() => onTakePhotoOrGallery('Gallery')}
            style={styles.containerOptionIcon}
            activeOpacity={0.7}
          >
            <SvgIcon name="image" width={30} height={30} fill={theme.colors.primaryText} />
          </TouchableOpacity>
          <Text fontFamily="EuclidCircularA-Medium" style={styles.optionText}>
            {t('signUp.photo')}
          </Text>
        </View>
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
