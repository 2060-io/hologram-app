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
  enableImageRefresh?: boolean
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
  enableImageRefresh = true,
}) => {
  const imageUri = useRef(uri)
  const [isValidImageUrl, setIsValidImageUrl] = useState<boolean>()
  useMemo(() => setIsValidImageUrl(uri?.length ? isUri(uri) : undefined), [uri])
  const theme = useTheme()
  const styles = getStyles(theme)
  const avatarSize = widthPercentageToDP(size.includes('%') ? size : `${size}%`)
  const initialsFontSize = avatarSize * 0.4
  const avatarDimensions = { height: avatarSize, width: avatarSize, borderRadius: avatarSize / 2 }
  const borderStyle = withBorder && { borderWidth: 1, borderColor: theme.colors.lightGrey }

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
      ) : isHttpUrl(uri!) ? (
        <SmartImage
          uri={'https://5752-2800-e2-3d80-3f3-f4cf-be79-d55b-d3ba.ngrok-free.app/images/ico-hologram.png'}
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
