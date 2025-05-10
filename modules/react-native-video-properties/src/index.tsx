import VideoProperties, { MediaInfo } from './NativeVideoProperties'

export function getVideoProperties(videoPath: string): Promise<MediaInfo> {
  return VideoProperties.getVideoProperties(videoPath)
}
