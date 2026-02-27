import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import React, { memo } from 'react'
import { TouchableOpacity } from 'react-native'

import getStyles from '../styles'

import { ChatStackParams } from '@src/components/Navigation/NavigationProps'
import { SvgIcon } from '@src/components/common'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { handleCameraPermission, handleMicrophonePermission } from '@src/utils/permissions'

const CameraButton = memo(() => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const navigation = useNavigation() as StackNavigationProp<ChatStackParams, 'Chat', 'stack_navigator_main'>

  const goToCamera = async () => {
    const cameraPermission = await handleCameraPermission()
    if (!cameraPermission) return
    const microphonePermission = await handleMicrophonePermission()
    if (!microphonePermission) return
    navigation.navigate('Camera')
  }

  return (
    <TouchableOpacity style={[styles.button, styles.buttonMarginRight]} onPress={goToCamera}>
      <SvgIcon name="camera" fill={theme.colors.primaryText} />
    </TouchableOpacity>
  )
})

export default CameraButton
