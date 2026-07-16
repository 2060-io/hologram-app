import { deleteFile } from '@src/utils/RNFS'
import { createResizedImage } from './preview'

// Profile pictures are sent to the Verifiable Service on service initialization, so they must be kept
// small (a JPEG under PROFILE_PICTURE_MAX_BYTES) to avoid slowing down the welcome message exchange.
const PROFILE_PICTURE_MAX_BYTES = 50 * 1024
// Each step lowers the JPEG quality and, in the last steps, the dimensions too. A real photo is already
// well under the limit at the first step; the later steps only kick in for extremely detailed images.
// The final (small, low quality) step is under the limit for any possible image, so the cap is guaranteed.
const PROFILE_PICTURE_STEPS = [
  { maxDimension: 512, quality: 80 },
  { maxDimension: 512, quality: 55 },
  { maxDimension: 384, quality: 50 },
  { maxDimension: 256, quality: 45 },
]

function base64SizeInBytes(base64: string) {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  return Math.floor((base64.length * 3) / 4) - padding
}

/**
 * Resizes and compresses an image into a JPEG that fits within PROFILE_PICTURE_MAX_BYTES, returning the
 * raw base64 (no data URL prefix) and mime type, matching how display pictures are stored and sent.
 *
 * Reuses createResizedImage (react-native-image-resizer) so EXIF orientation is honored and the output
 * has real pixel dimensions. Quality is only lowered when the encoded size still exceeds the limit.
 */
export async function createProfilePicture(options: { imageUrl: string }) {
  const { imageUrl } = options
  let smallest: { mimeType: string; base64: string; size: number } | null = null

  for (const { maxDimension, quality } of PROFILE_PICTURE_STEPS) {
    const resized = await createResizedImage({
      imageUrl,
      maxWidth: maxDimension,
      maxHeight: maxDimension,
      quality,
    })
    if (!resized) break

    // createResizedImage returns a `data:image/jpeg;base64,...` URL, but display pictures store raw base64
    const base64 = resized.base64.slice(resized.base64.indexOf(',') + 1)
    await deleteFile(resized.path)

    const size = base64SizeInBytes(base64)
    if (!smallest || size < smallest.size) smallest = { mimeType: 'image/jpeg', base64, size }
    if (size <= PROFILE_PICTURE_MAX_BYTES) break
  }

  return smallest ? { mimeType: smallest.mimeType, base64: smallest.base64 } : null
}
