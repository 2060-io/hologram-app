import React, { useEffect, useRef, useState } from 'react'
import { TouchableOpacity, View } from 'react-native'

import SmartImage from './SmartImage'
import getStyles from './styles'

import Text from '@src/components/common/Text'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { widthPercentageToDP } from '@src/utils/responsiveUtils'

const getNameInitials = (fullName: string) => {
  const nameParts = fullName.trim().split(' ')
  const firstName = nameParts[0]?.[0] || ''
  const lastName = nameParts[1]?.[0] || ''
  return (firstName + lastName).toUpperCase()
}

const isUri = (value: string) => /\w+:(\/?\/?)[^\s]+/.test(value)

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
  const [isValidImageUrl, setIsValidImageUrl] = useState<boolean>(true)
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
      {uri && (
        <SmartImage
          uri={uri}
          setIsValidImageUrl={setIsValidImageUrl}
          onImageContent={onSmartImageContent}
          style={styles.avatar}
          enableImageRefresh={enableImageRefresh}
        />
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
      <Text fontFamily="EuclidCircularA-Medium" style={[styles.initials, { fontSize: initialsFontSize }]}>
        {label ? getNameInitials(label) : 'N/A'}
      </Text>
    </View>
  )

  return isValidImageUrl ? renderAvatar() : renderNameInitials()
}

export default Avatar
