import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import React, { memo } from 'react'
import { TouchableOpacity } from 'react-native'

import getStyles from '../styles'

import { PersonalChatStackParams } from '@2060/components/Navigation/NavigationProps'
import { SvgIcon } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { handleCameraPermission } from '@2060/utils/permissions'

const CameraButton = memo(() => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const navigation = useNavigation() as StackNavigationProp<
    PersonalChatStackParams,
    'PersonalChat',
    'stack_navigator_main'
  >

  const goToCamera = async () => {
    const cameraPermission = await handleCameraPermission()
    if (!cameraPermission) return
    navigation.navigate('Camera')
  }

  return (
    <TouchableOpacity style={{ ...styles.button, marginRight: 4 }} onPress={goToCamera}>
      <SvgIcon name="camera" fill={theme.colors.primaryText} />
    </TouchableOpacity>
  )
})

export default CameraButton
