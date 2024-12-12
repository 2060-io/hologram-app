import type { CameraProps } from 'react-native-vision-camera'

export type MRZCameraProps = {
  skipScan: () => void
  cameraProps: CameraProps
  onData: (lines: string[]) => void | Promise<void>
  scanSuccess: boolean
  refuse: () => void
}
