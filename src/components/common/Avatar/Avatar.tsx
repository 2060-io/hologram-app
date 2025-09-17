import { isUri } from '@credo-ts/core/build/utils'
import React, { useEffect, useRef, useState } from 'react'
import { Image, TouchableOpacity, View } from 'react-native'
import { SvgUri } from 'react-native-svg'

import SmartImage from './SmartImage'
import getStyles from './styles'

import Text from '@2060/components/common/Text'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { widthPercentageToDP } from '@2060/utils/responsiveUtils'

const getNameInitials = (fullName: string) => {
  const nameParts = fullName.trim().split(' ')
  const firstName = nameParts[0]?.[0] || ''
  const lastName = nameParts[1]?.[0] || ''
  return (firstName + lastName).toUpperCase()
}

const isHttpUrl = (uri: string) => {
  return uri.startsWith('https://') || uri.startsWith('http://')
}

type Props = {
  uri?: string
  label?: string
  size: string
  withBorder?: boolean
  bgAvatarInitials?: string
  onImagePressed?: (imageUri: string) => void
  enableImageRefresh?: boolean
}

const Avatar: React.FC<Props> = ({
  uri,
  label,
  size,
  withBorder = false,
  bgAvatarInitials,
  onImagePressed,
  enableImageRefresh = true,
}) => {
  const imageUri = useRef(uri)
  const [isValidImageUrl, setIsValidImageUrl] = useState<boolean>()
  const theme = useTheme()
  const styles = getStyles(theme)
  const avatarSize = widthPercentageToDP(size.includes('%') ? size : `${size}%`)
  const initialsFontSize = avatarSize * 0.4
  const avatarDimensions = { height: avatarSize, width: avatarSize, borderRadius: avatarSize / 2 }
  const borderStyle = withBorder && { borderWidth: 1, borderColor: theme.colors.lightGrey }

  useEffect(() => {
    setIsValidImageUrl(uri ? isUri(uri) : false)
  }, [uri])

  const onSmartImageContent = (imageContent: string) => {
    imageUri.current = imageContent
  }

  const renderAvatar = () => (
    <TouchableOpacity
      style={[styles.containerAvatar, avatarDimensions, borderStyle]}
      disabled={!onImagePressed}
      onPress={() => onImagePressed?.(imageUri.current ?? '')}
    >
      {uri?.endsWith('.svg') ? (
        <SvgUri
          uri={uri}
          style={styles.avatar}
          width={styles.avatar.width}
          height={styles.avatar.height}
          onError={() => setIsValidImageUrl(false)}
        />
      ) : uri && isHttpUrl(uri) ? (
        <SmartImage
          uri={uri}
          setIsValidImageUrl={setIsValidImageUrl}
          onImageContent={onSmartImageContent}
          style={styles.avatar}
          enableImageRefresh={enableImageRefresh}
        />
      ) : (
        <Image source={{ uri }} style={styles.avatar} onError={() => setIsValidImageUrl(false)} />
      )}
    </TouchableOpacity>
  )

  const renderNameInitials = () => (
    <View
      style={[
        styles.containerAvatar,
        { backgroundColor: bgAvatarInitials ?? '#E5E9EA' },
        avatarDimensions,
        borderStyle,
      ]}
    >
      <Text typography="EuclidCircularA-Medium" style={[styles.initials, { fontSize: initialsFontSize }]}>
        {getNameInitials(label ?? 'N A')}
      </Text>
    </View>
  )

  return isValidImageUrl ? renderAvatar() : renderNameInitials()
}

export default Avatar
