export type MediaCaptured = {
  origin: 'vision-camera' | 'image-crop-picker'
  type: 'image' | 'video'
  width: number
  height: number
  path: string
  duration?: number | null
}
