import type { CameraDevice } from 'react-native-vision-camera'

export type MRZCameraProps = {
  skipScan: () => void
  cameraProps: { device: CameraDevice; isActive: boolean }
  onData: (lines: string[]) => void | Promise<void>
  scanSuccess: boolean
  refuse: () => void
}
