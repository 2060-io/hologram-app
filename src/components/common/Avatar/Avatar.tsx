import { isUri } from '@credo-ts/core/build/utils'
import React, { useMemo, useRef, useState } from 'react'
import { Image, TouchableOpacity, View } from 'react-native'
import { SvgUri } from 'react-native-svg'

import SmartImage from './SmartImage'
import getStyles from './styles'

import Text from '@2060/components/common/Text'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { getNameInitials } from '@2060/utils'
import { widthPercentageToDP } from '@2060/utils/responsiveUtils'

type Props = {
  uri?: string
  label?: string
  size: string
  withBorder?: boolean
  bgAvatarInitials?: string
  onImagePressed?: (imageUri: string) => void
}

const isHttpUrl = (uri: string) => {
  return uri.startsWith('https://') || uri.startsWith('http://')
}

const Avatar: React.FC<Props> = ({
  uri,
  label,
  size,
  withBorder = false,
  bgAvatarInitials,
  onImagePressed,
}) => {
  const imageUri = useRef(uri)
  const [isValidImageUrl, setIsValidImageUrl] = useState<boolean>()
  useMemo(() => setIsValidImageUrl(uri?.length ? isUri(uri) : undefined), [uri])
  const theme = useTheme()
  const avatarSize = widthPercentageToDP(size.includes('%') ? size : `${size}%`)
  const initialsFontSize = avatarSize * 0.4

  const styles = getStyles(theme)
  const avatarSizeStyle = { height: avatarSize, width: avatarSize, borderRadius: avatarSize / 2 }
  const borderStyle = withBorder && { borderWidth: 1, borderColor: theme.colors.lightGrey }

  const onSmartImageContent = (imageContent: string) => {
    imageUri.current = imageContent
  }

  const renderAvatar = () => (
    <TouchableOpacity
      style={[styles.containerAvatar, styles.containerBgAvatar, avatarSizeStyle, borderStyle]}
      disabled={!onImagePressed}
      onPress={() => (imageUri.current ? onImagePressed?.(imageUri.current) : null)}
    >
      {uri?.endsWith('.svg') ? (
        <SvgUri
          uri={uri}
          style={styles.avatar}
          width={styles.avatar.width}
          height={styles.avatar.height}
          onError={() => setIsValidImageUrl(false)}
        />
      ) : isHttpUrl(uri!) ? (
        <SmartImage
          uri={uri!}
          setIsValidImageUrl={setIsValidImageUrl}
          onImageContent={onSmartImageContent}
          style={styles.avatar}
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
        avatarSizeStyle,
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
