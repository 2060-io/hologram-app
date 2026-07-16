import { TypedArrayEncoder } from '@credo-ts/core'
import { logError } from '@src/utils'
import { Images } from 'react-native-nitro-image'

// Profile pictures are sent to the Verifiable Service on service initialization, so they must be kept
// small (a JPEG under PROFILE_PICTURE_MAX_BYTES) to avoid slowing down the welcome message exchange.
const PROFILE_PICTURE_MAX_BYTES = 50 * 1024
const PROFILE_PICTURE_MAX_DIMENSION = 512
const PROFILE_PICTURE_INITIAL_QUALITY = 80
const PROFILE_PICTURE_MIN_QUALITY = 40
const PROFILE_PICTURE_QUALITY_STEP = 15

/**
 * Resizes and compresses an image into a JPEG that fits within PROFILE_PICTURE_MAX_BYTES, returning the
 * raw base64 (no data URL prefix) and mime type, matching how display pictures are stored and sent.
 *
 * Everything runs in-memory via nitro-image: we resize once (preserving aspect ratio) and encode as JPEG,
 * lowering the quality only if the encoded size still exceeds the limit. Because encoding produces an
 * ArrayBuffer, the exact byte size is known immediately, without writing any temporary files.
 */
export async function createProfilePicture(options: { imageUrl: string }) {
  try {
    const original = await Images.loadFromFileAsync(options.imageUrl)

    // Fit within the max dimension while preserving aspect ratio (never upscale)
    const scale = Math.min(1, PROFILE_PICTURE_MAX_DIMENSION / Math.max(original.width, original.height))
    const image =
      scale < 1
        ? await original.resizeAsync(Math.round(original.width * scale), Math.round(original.height * scale))
        : original

    let quality = PROFILE_PICTURE_INITIAL_QUALITY
    let encoded = await image.toEncodedImageDataAsync('jpg', quality)
    while (encoded.buffer.byteLength > PROFILE_PICTURE_MAX_BYTES && quality > PROFILE_PICTURE_MIN_QUALITY) {
      quality = Math.max(PROFILE_PICTURE_MIN_QUALITY, quality - PROFILE_PICTURE_QUALITY_STEP)
      encoded = await image.toEncodedImageDataAsync('jpg', quality)
    }

    return { mimeType: 'image/jpeg', base64: TypedArrayEncoder.toBase64(new Uint8Array(encoded.buffer)) }
  } catch (error) {
    logError(`Error creating profile picture: ${error}`)
    return null
  }
}
