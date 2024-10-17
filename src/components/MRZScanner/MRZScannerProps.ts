import type { CameraProps } from 'react-native-vision-camera'

export type MRZCameraProps = {
  /**
   * callback function to skip mrz scan
   * @returns
   */
  onSkipPressed?: () => void
  /**
   * all options for the camera
   */
  cameraProps: CameraProps
  onData?: (OCRResults: string[]) => void | Promise<void>
  scanSuccess?: boolean
}

export type MRZScannerProps = {
  /**
   * callback function to skip mrz scan
   * @returns
   */
  onSkipPressed: () => void
  /**
   * callback function to get the final MRZ results
   * @param mrzResults
   * @returns
   */
  onMRZFinalResults: (mrzResults: string[]) => void | Promise<void>
}
