import type { CameraProps } from 'react-native-vision-camera'

export type MRZCameraProps = {
  /**
   * callback function to skip mrz scan
   * @returns
   */
  skipScan?: () => void
  /**
   * all options for the camera
   */
  cameraProps: CameraProps
  onData?: (OCRResults: string[]) => void | Promise<void>
  scanSuccess?: boolean
}
