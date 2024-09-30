import { PictureData } from '@2060.io/credo-ts-didcomm-user-profile'
import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { View, TouchableOpacity, Image } from 'react-native'

import Avatar from '../common/Avatar'

import getStyles from './styles'

import { Text, TextInput, SvgIcon } from '@2060/components/common'
import { useImageCropPicker, ImageOrVideo } from '@2060/hooks'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { dataUrl } from '@2060/utils/connectionUtils'

type Props = {
  displayPicture: PictureData | undefined
  displayName: string
  onHandleChangePicture(pictureData: PictureData | undefined): void
  onHandleChangeName(value: string): void
}

const UserProfileForm: React.FC<Props> = props => {
  const { t } = useTranslation()
  const theme = useTheme()
  const { takePhotoOrVideo, takePhotoOrVideoFromGallery } = useImageCropPicker()
  const { displayPicture, displayName, onHandleChangePicture, onHandleChangeName } = props

  const imgUrl = dataUrl(displayPicture?.mimeType, displayPicture?.base64)
  const defaultAvatar = Image.resolveAssetSource(require('@2060/assets/images/defaultUser.png')).uri
  const avatarUri = imgUrl || (displayName.trim().length > 0 ? '' : defaultAvatar)
  const styles = getStyles(theme)

  const onChangeAvatarInfo = (info: ImageOrVideo) => {
    onHandleChangePicture(info.data ? { mimeType: info.mime, base64: info.data } : undefined)
  }

  const onTakePhotoOrGallery = (type: 'Gallery' | 'Camera') => {
    return {
      Camera: async () => await takePhotoOrVideo(onChangeAvatarInfo),
      Gallery: async () => await takePhotoOrVideoFromGallery(onChangeAvatarInfo),
    }[type]()
  }

  return (
    <View>
      <Text typography="EuclidCircularA-Regular" style={styles.textInputDescription}>{`${t(
        'signUp.textInputNicknameDescription',
      )}`}</Text>

      <View style={styles.containerRootAvatar}>
        {imgUrl.length > 0 && (
          <TouchableOpacity
            style={styles.btnClose}
            onPress={() => onHandleChangePicture(undefined)}
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
          <Text typography="EuclidCircularA-Medium" style={styles.optionText}>
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
          <Text typography="EuclidCircularA-Medium" style={styles.optionText}>
            {t('signUp.photo')}
          </Text>
        </View>
      </View>
      <TextInput
        value={displayName}
        textInputstyle={styles.textInput}
        onChangeText={onHandleChangeName}
        placeholder={t('signUp.chooseNickname')}
        placeholderTextColor={theme.colors.secondaryText}
      />
    </View>
  )
}

export default memo(UserProfileForm)
