import {
  Easing,
  SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { CameraProps } from 'react-native-vision-camera'

type Props = {
  isInitialized: boolean
  cameraZoom: SharedValue<number>
  minZoom: number
  maxZoom: number
  isPressingButton: SharedValue<boolean>
}

export const useAnimatedStyles = ({
  isInitialized,
  cameraZoom,
  minZoom,
  maxZoom,
  isPressingButton,
}: Props) => {
  const cameraAnimatedProps = useAnimatedProps<CameraProps>(() => {
    const zoom = Math.max(Math.min(cameraZoom.value, maxZoom), minZoom)
    return { zoom }
  }, [maxZoom, minZoom, cameraZoom])

  const recordingStyle = useAnimatedStyle(
    () => ({
      transform: [
        {
          scale: withSpring(isPressingButton.value ? 1 : 0, {
            mass: 1,
            damping: 35,
            stiffness: 300,
          }),
        },
      ],
    }),
    [isPressingButton],
  )
  const buttonStyle = useAnimatedStyle(() => {
    let scale: number
    if (isInitialized) {
      if (isPressingButton.value) {
        scale = withRepeat(
          withSpring(1, {
            stiffness: 100,
            damping: 1000,
          }),
          -1,
          true,
        )
      } else {
        scale = withSpring(0.9, {
          stiffness: 500,
          damping: 300,
        })
      }
    } else {
      scale = withSpring(0.6, {
        stiffness: 500,
        damping: 300,
      })
    }

    return {
      opacity: withTiming(isInitialized ? 1 : 0.3, {
        duration: 100,
        easing: Easing.linear,
      }),
      transform: [
        {
          scale: scale,
        },
      ],
    }
  }, [isInitialized, isPressingButton])

  return {
    cameraAnimatedProps,
    recordingStyle,
    buttonStyle,
  }
}
