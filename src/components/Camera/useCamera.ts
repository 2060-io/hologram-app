import type {
  GestureStateChangeEvent,
  GestureType,
  GestureUpdateEvent,
  PanGestureHandlerEventPayload,
} from 'react-native-gesture-handler'

import { useCallback, useRef, useState } from 'react'
import { Gesture } from 'react-native-gesture-handler'
import { cancelAnimation, Extrapolation, interpolate, useSharedValue } from 'react-native-reanimated'
import {
  Camera as VisionCamera,
  useCameraDevice,
  CameraPosition,
  VideoFile,
  CameraCaptureError,
  useCameraFormat,
} from 'react-native-vision-camera'

import { MediaCaptured } from './Props'

import { IS_ANDROID, IS_IOS, MAX_VIDEO_DURATION } from '@2060/constants'
import { ImageOrVideo, useImageCropPicker } from '@2060/hooks'
import { getMinutesAndSeconds, logError } from '@2060/utils'
import { deleteFile } from '@2060/utils/RNFS'
import { screenHeight, screenWidth } from '@2060/utils/responsiveUtils'

const START_RECORDING_DELAY = 200
const MAX_ZOOM_FACTOR = 10
const targetFps = 60
const INITIAL_TIME_RECORDED = '00:00'

type Props = {
  isVideoMode: boolean
  closeCamera: () => void
}
export const useCamera = ({ isVideoMode, closeCamera }: Props) => {
  const { getPhotoOrVideoFromGallery } = useImageCropPicker()
  const [cameraPosition, setCameraPosition] = useState<CameraPosition>('front')
  const [flash, setFlash] = useState<'off' | 'on'>('off')
  const [isRecordingVideo, setIsRecordingVideo] = useState(false)
  const [recordingProgress, setRecordingProgress] = useState(INITIAL_TIME_RECORDED)
  const [isInitialized, setIsInitialized] = useState(false)
  const [mediaCaptured, setMediaCaptured] = useState<MediaCaptured | null>(null)
  const tapHandler = useRef<GestureType>(undefined)
  const panHandler = useRef<GestureType>(undefined)
  const camera = useRef<VisionCamera>(null)
  const pressDownDate = useRef<Date | undefined>(undefined)
  const stopRecordingTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)
  const startY = useSharedValue(0)
  const offsetY = useSharedValue(0)
  const isRecordingProgress = useSharedValue(0)
  const isPressingButton = useSharedValue(false)
  const cameraZoom = useSharedValue(1)
  const device = useCameraDevice(cameraPosition)
  const minZoom = device?.minZoom ?? 1
  const maxZoom = Math.min(device?.maxZoom ?? 1, MAX_ZOOM_FACTOR)
  const supportsFlash = device?.hasFlash ?? false
  const supportsTorch = device?.hasTorch ?? false
  const screenAspectRatio = screenHeight / screenWidth
  const format = useCameraFormat(device, [
    { fps: targetFps },
    { videoAspectRatio: screenAspectRatio },
    { videoResolution: 'max' },
    { photoAspectRatio: screenAspectRatio },
    { photoResolution: 'max' },
  ])
  const fps = Math.min(format?.maxFps ?? 1, targetFps)

  const onInitialized = useCallback(() => {
    setIsInitialized(true)
  }, [])

  const updateMediaCapturedInfo = useCallback((newMediaCaptured: MediaCaptured) => {
    setMediaCaptured(newMediaCaptured)
  }, [])

  const getFileFromMedia = useCallback(() => {
    getPhotoOrVideoFromGallery(isVideoMode ? 'any' : 'photo', (values: ImageOrVideo) => {
      const { path, height, width, mime, duration } = values
      const type = mime.startsWith('image') ? 'image' : 'video'
      updateMediaCapturedInfo({ type, path, height, width, duration, origin: 'image-crop-picker' })
    })
  }, [])

  const takePhoto = useCallback(async () => {
    if (!camera.current) return
    try {
      const photo = await camera.current.takePhoto({ flash: supportsFlash ? flash : 'off' })
      const { width, height } = photo
      // its necessary to invert dimensions due to in iOS orientation is inverted by default.
      // So, when it returns a landscape orientation the real image is in portrait mode and vice versa
      if (IS_IOS && photo.orientation.toString().includes('landscape')) {
        photo.height = width
        photo.width = height
      }
      // its necessary to invert dimensions due to in some Android devices portrait photos orientation
      // have inverted dimensions as if they had landscape orientation
      if (IS_ANDROID && photo.orientation.toString().includes('portrait') && width > height) {
        photo.height = width
        photo.width = height
      }
      const path = IS_IOS ? photo.path : `file://${photo.path}`
      updateMediaCapturedInfo({
        origin: 'vision-camera',
        type: 'image',
        width: photo.width,
        height: photo.height,
        path,
      })
    } catch (error) {
      logError('Error taking photo', error)
    }
  }, [flash, supportsFlash])

  const onStoppedRecording = useCallback(() => {
    setIsRecordingVideo(false)
    setRecordingProgress(INITIAL_TIME_RECORDED)
    cancelAnimation(isRecordingProgress)
  }, [isRecordingProgress])

  const onRecordingProgress = useCallback((progress: number) => {
    setRecordingProgress(getMinutesAndSeconds(progress))
  }, [])

  const onRecordingFinished = useCallback(
    (video: VideoFile) => {
      const path = IS_IOS ? video.path : `file://${video.path}`
      const { width, height, duration } = video
      updateMediaCapturedInfo({
        origin: 'vision-camera',
        type: 'video',
        width,
        height,
        path,
        duration: duration * 1000,
      })
      onStoppedRecording()
    },
    [isRecordingProgress],
  )

  const onRecordingError = (error: CameraCaptureError) => {
    logError('Recording failed!', error)
    onStoppedRecording()
  }

  const startRecording = useCallback(() => {
    try {
      setRecordingProgress(INITIAL_TIME_RECORDED)
      camera.current?.startRecording({
        flash: supportsTorch ? flash : 'off',
        onRecordingProgress,
        onRecordingFinished,
        onRecordingError,
      })
      setIsRecordingVideo(true)
      stopRecordingTimeout.current = setTimeout(() => {
        stopRecording()
      }, MAX_VIDEO_DURATION)
    } catch (e) {
      logError('Failed to start recording!', e, 'camera')
    }
  }, [camera, supportsTorch, flash, onStoppedRecording])

  const stopRecording = useCallback(async () => {
    try {
      clearTimeout(stopRecordingTimeout.current)
      await camera.current?.stopRecording()
    } catch (e) {
      logError('Failed to stop recording!', e)
    }
  }, [camera])

  const close = useCallback(() => {
    if (mediaCaptured) {
      setMediaCaptured(null)
      deleteFile(mediaCaptured.path)
    } else {
      closeCamera()
    }
  }, [mediaCaptured])

  const handleFlash = () => {
    setFlash(f => (f === 'off' ? 'on' : 'off'))
  }

  const flipCamera = () => {
    setCameraPosition(prev => (prev === 'front' ? 'back' : 'front'))
  }

  const onBeginTapGesture = () => {
    isRecordingProgress.value = 0
    isPressingButton.value = true
    const now = new Date()
    pressDownDate.current = now
    setTimeout(() => {
      if (pressDownDate.current === now && isVideoMode) {
        // user is still pressing down after 200ms, so his intention is to create a video
        startRecording()
      }
    }, START_RECORDING_DELAY)
  }

  const onEndTapGesture = async () => {
    try {
      if (!pressDownDate.current) return
      const now = new Date()
      const diff = now.getTime() - pressDownDate.current.getTime()
      pressDownDate.current = undefined
      if (diff > START_RECORDING_DELAY && isVideoMode) {
        // user has held the button for more than 200ms and isVideoMode, so he has been recording this time.
        if (isRecordingVideo) await stopRecording()
      } else {
        // user has released the button within 200ms, so his intention is to take a single picture.
        await takePhoto()
      }
    } finally {
      setTimeout(() => {
        isPressingButton.value = false
      }, 500)
    }
  }

  const tapGesture = Gesture.Tap()
    .runOnJS(true)
    .enabled(isInitialized)
    .withRef(tapHandler)
    .shouldCancelWhenOutside(false)
    .maxDuration(99999999) // prevents from going to FAILED when user moves finger outside child view (zoom)
    .simultaneousWithExternalGesture(panHandler)
    .onBegin(onBeginTapGesture)
    .onEnd(onEndTapGesture)

  const onStartPanGesture = (event: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
    startY.value = event.absoluteY
    const yForFullZoom = startY.value * 0.7
    const offsetYForFullZoom = startY.value - yForFullZoom
    offsetY.value = interpolate(
      cameraZoom.value,
      [minZoom, maxZoom],
      [0, offsetYForFullZoom],
      Extrapolation.CLAMP,
    )
  }

  const onUpdatePanGesture = (event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
    const offset = offsetY.value ?? 0
    const startYInternal = startY.value ?? screenHeight
    const yForFullZoom = startYInternal * 0.7
    cameraZoom.value = interpolate(
      event.absoluteY - offset,
      [yForFullZoom, startYInternal],
      [maxZoom, minZoom],
      Extrapolation.CLAMP,
    )
  }
  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .enabled(isInitialized)
    .withRef(panHandler)
    .failOffsetX([-screenWidth, screenWidth])
    .activeOffsetY([-2, 2])
    .simultaneousWithExternalGesture(tapHandler)
    .onStart(onStartPanGesture)
    .onUpdate(onUpdatePanGesture)

  return {
    camera,
    device,
    format,
    fps,
    onInitialized,
    close,
    flash,
    handleFlash,
    flipCamera,
    mediaCaptured,
    tapGesture,
    panGesture,
    isInitialized,
    cameraZoom,
    minZoom,
    maxZoom,
    supportsFlash,
    getFileFromMedia,
    isPressingButton,
    isRecordingVideo,
    recordingProgress,
  }
}
