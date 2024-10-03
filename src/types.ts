import type { MRZProperties } from './mrzProperties'
import type { CameraProps } from 'react-native-vision-camera'

export type MRZCameraProps = {
  /**
   * callback function to skip the photo
   * @returns
   */
  onSkipPressed?: () => void
  /**
   * The text of the photo skip button.
   */
  skipButtonText?: string
  /**
   * all options for the camera
   */
  cameraProps: CameraProps
  onData?: (OCRResults: string[]) => void | Promise<void>
  scanSuccess?: boolean
  isActiveCamera?: boolean
}

export type MRZScannerProps = MRZCameraProps & {
  /**
   * callback function to get the final MRZ results
   * @param mrzResults
   * @returns
   */
  mrzFinalResults: (mrzResults: MRZProperties) => void | Promise<void>
  /**
   * If true, the MRZ feedback will be enabled.
   */
  enableMRZFeedBack?: boolean
}
