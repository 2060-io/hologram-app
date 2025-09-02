import React, { useRef, useState } from 'react'
import { StyleSheet, TouchableOpacity, View, Image } from 'react-native'
import { Camera, useCameraDevice, CameraPosition, PhotoFile } from 'react-native-vision-camera'

import getStyles from '../styles'

import { Icon, Modal, SvgIcon } from '@2060/components/common'
import { useChatActions } from '@2060/hooks'
import { DidCommMediaFileSharingData } from '@2060/hooks/agent'
import { createDidCommPreview } from '@2060/hooks/media/preview'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { log, logError } from '@2060/utils'
import { deleteFile } from '@2060/utils/RNFS'

const CameraButton = () => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const [showCamera, setShowCamera] = useState(false)
  const [cameraPosition, setCameraPosition] = useState<CameraPosition>('front')
  const [flash, setFlash] = useState(false)
  const [canCallCameraFunctions, setCanCallCameraFunctions] = useState(false)
  const [photoTakenPath, setImageTaken] = useState<string | undefined>(undefined)
  const photoTaken = useRef<PhotoFile | undefined>(undefined)
  const camera = useRef<Camera>(null)
  const device = useCameraDevice(cameraPosition)

  const { shareMediaToDidComm } = useChatActions()

  const closeAfterSendPhoto = () => {
    setImageTaken(undefined)
    photoTaken.current = undefined
    setShowCamera(false)
  }

  const close = () => {
    if (photoTakenPath) {
      setImageTaken(undefined)
      deleteFile(photoTakenPath)
    } else {
      setShowCamera(false)
    }
  }

  const takePhoto = async () => {
    if (!canCallCameraFunctions || !camera.current) return
    const photo = await camera?.current.takePhoto({
      flash: flash ? 'on' : 'off',
    })
    setImageTaken(photo.path)
    photoTaken.current = photo
  }

  const handleFlash = () => {
    setFlash(prev => !prev)
  }

  const switchCamera = () => {
    setCameraPosition(prev => (prev === 'front' ? 'back' : 'front'))
  }

  const sendPhoto = async () => {
    const preview = await createDidCommPreview({
      localFilePath: photoTakenPath!,
      mimeType: 'image/jpeg',
    })
    log('preview', photoTaken.current?.width, photoTaken.current?.height)
    const didCommMediaFileSharingData: DidCommMediaFileSharingData = {
      path: photoTaken.current?.path!,
      //TODO: set correct file mime
      mime: 'image/jpeg',
      preview,
      //TOD: set correct size
      size: 527502,
      width: photoTaken.current?.height,
      height: photoTaken.current?.width,
    }
    shareMediaToDidComm({
      ...didCommMediaFileSharingData,
      width: didCommMediaFileSharingData.width ?? undefined,
      height: didCommMediaFileSharingData.height ?? undefined,
    }).catch(logError)
    closeAfterSendPhoto()
  }

  return (
    <>
      <Modal visible={showCamera && !!device} transparent animationType="slide">
        <Camera
          style={StyleSheet.absoluteFillObject}
          device={device!}
          isActive={showCamera}
          ref={camera}
          photo
          onInitialized={() => setCanCallCameraFunctions(true)}
        />
        <TouchableOpacity
          onPress={close}
          style={{
            position: 'absolute',
            left: 20,
            top: 50,
            right: 0,
            zIndex: 3,
            backgroundColor: theme.colors.black,
            width: 50,
            height: 50,
            borderRadius: 25,
          }}
        >
          <SvgIcon name="close" fill={theme.colors.white} width={50} height={50} />
        </TouchableOpacity>
        {photoTakenPath && (
          <View
            style={{
              ...StyleSheet.absoluteFillObject,
              zIndex: 2,
            }}
          >
            <Image
              source={{ uri: photoTakenPath }}
              style={{
                width: '100%',
                height: '100%',
              }}
            />
            <TouchableOpacity
              onPress={sendPhoto}
              style={{
                justifyContent: 'center',
                alignItems: 'flex-end',
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '20%',
                alignSelf: 'flex-end',
              }}
            >
              <SvgIcon name="send" fill={theme.colors.white} width={50} height={50} />
            </TouchableOpacity>
          </View>
        )}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '20%',
          }}
        >
          <TouchableOpacity onPress={handleFlash}>
            <Icon
              as="MaterialCommunityIcons"
              name="flash"
              size={40}
              color={flash ? 'yellow' : theme.colors.white}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={takePhoto}>
            <Icon as="FontAwesome" name="dot-circle-o" size={70} color={theme.colors.white} />
          </TouchableOpacity>
          <TouchableOpacity onPress={switchCamera}>
            <SvgIcon name="flipCamera" fill={theme.colors.white} width={40} height={40} />
          </TouchableOpacity>
        </View>
      </Modal>
      <TouchableOpacity
        style={{ ...styles.iconContainer, marginRight: 4 }}
        onPress={() => setShowCamera(true)}
      >
        <SvgIcon name="camera" fill={theme.colors.primaryText} />
      </TouchableOpacity>
    </>
  )
}

export default CameraButton
