import type {
  GestureStateChangeEvent,
  GestureUpdateEvent,
  PanGestureHandlerEventPayload,
} from 'react-native-gesture-handler'

import { useRef, useState } from 'react'
import { Gesture } from 'react-native-gesture-handler'
import { CameraDevice } from 'react-native-vision-camera'

type Props = {
  device: CameraDevice | undefined
  isInitialized: boolean
}

export const useCameraPanGesture = ({ device, isInitialized }: Props) => {
  const [exposure, setExposure] = useState(0)
  const exposureRef = useRef(0)
  const previousYPos = useRef(0)

  const onStartCameraPanGesture = (event: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
    previousYPos.current = event.absoluteY
  }

  const onUpdateCameraPanGesture = (event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
    const currentYPos = event.absoluteY
    const deltaY = currentYPos - previousYPos.current
    const isAlLeastFiveOfMove = Math.abs(deltaY) >= 5
    if (isAlLeastFiveOfMove) {
      const isScrollingDown = deltaY > 0
      if (isScrollingDown) {
        const canDecreaseExposure = device?.minExposure ? exposureRef.current > device.minExposure : false
        if (canDecreaseExposure) {
          exposureRef.current = exposureRef.current - 1
          setExposure(exposureRef.current)
        }
      } else {
        const canIncreaseExposure = device?.maxExposure ? exposureRef.current < device.maxExposure : false
        if (canIncreaseExposure) {
          exposureRef.current = exposureRef.current + 1
          setExposure(exposureRef.current)
        }
      }
      previousYPos.current = currentYPos
    }
  }

  const cameraPanGesture = Gesture.Pan()
    .runOnJS(true)
    .enabled(isInitialized)
    .onStart(onStartCameraPanGesture)
    .onUpdate(onUpdateCameraPanGesture)
    .maxPointers(1)

  return {
    cameraPanGesture,
    exposure,
  }
}
