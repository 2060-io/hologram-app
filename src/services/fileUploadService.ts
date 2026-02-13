import 'react-native-get-random-values'
import 'react-native-url-polyfill/auto'
import 'web-streams-polyfill/dist/polyfill'

import {
  S3Client,
  CreateMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  UploadPartCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

import { log } from '@src/utils/log'

// Set the credential of aws
const s3Client = new S3Client({
  endpoint: 'https://s3.minio.dev.2060.io',
  forcePathStyle: true,
  region: 'us-east-1',
  logger: console,
  credentials: {
    accessKeyId: 'G45LQG5QLMK3BT6EPAJM',
    secretAccessKey: 'X47WujS61PDMkSPzS+VDvRmZMYrTf4W1fc7Wi2Dt',
    sessionToken:
      'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3NLZXkiOiJHNDVMUUc1UUxNSzNCVDZFUEFKTSIsImV4cCI6MTc3MTAzNTQ4NiwicGFyZW50IjoiYWRtaW4ifQ.yPsnFgNWKGOoUQDu76Wjq1lOVa-lrcOlHTiaWwWUWLpQhVoLM7kRPEHTOd79IlljxTfJWTbl3qer6WRTsjDXmQ',
  },
})

/**
 * Uploads a file to S3 using multipart upload with progress tracking.
 * If an error occurs during upload, the multipart session is automatically aborted.
 * @param filePath - The local file path (file:// URI) to upload
 * @param key - The S3 object key (path) where the file will be stored
 * @param onMultipartCreated - Callback invoked when the multipart upload session is created
 * @param onProgress - Callback invoked with upload progress as a percentage (0-100)
 * @param onError - Callback invoked if an error occurs during upload
 * @param onUploadComplete - Callback invoked with the result when upload completes successfully
 * @throws {Error} If file upload fails, part upload fails, ETag is missing, or multipart completion fails
 */
export async function s3UploadFile({
  filePath,
  key,
  onMultipartCreated,
  onProgress,
  onError,
  onUploadComplete,
}: {
  filePath: string
  key: string
  onMultipartCreated: () => void
  onProgress: (progress: number) => void
  onError: (error: unknown) => void
  onUploadComplete: (result: { key: string }) => void
}) {
  const PART_SIZE = 5 * 1024 * 1024 // 5MB minimum required by S3
  let uploadId: string | null = null
  try {
    // 1️⃣ Create multipart upload
    const createRes = await s3Client.send(
      new CreateMultipartUploadCommand({
        Bucket: 'public',
        Key: key,
        ContentType: 'application/octet-stream',
      }),
    )

    onMultipartCreated()
    uploadId = createRes.UploadId!

    // 2️⃣ Get file blob using fetch (RN-safe)
    const fileBlob = await fetch('file://' + filePath).then(r => r.blob())

    const fileSize = fileBlob.size
    const totalParts = Math.ceil(fileSize / PART_SIZE)

    const parts: { ETag: string; PartNumber: number }[] = []
    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
      // 3️⃣ Generate presigned URL for this part
      const presignedUrl = await getSignedUrl(
        s3Client,
        new UploadPartCommand({
          Bucket: 'public',
          Key: key,
          UploadId: uploadId,
          PartNumber: partNumber,
        }),
        { expiresIn: 3600 },
      )

      // 4️⃣ Upload using fetch (fully controlled HTTP layer)
      const start = (partNumber - 1) * PART_SIZE
      const end = Math.min(start + PART_SIZE, fileSize)
      const chunkBlob = fileBlob.slice(start, end)
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: chunkBlob,
      })

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed for part ${partNumber}: ${uploadResponse.status}`)
      }

      const etag = uploadResponse.headers.get('ETag')
      if (!etag) {
        throw new Error('ETag missing from upload response')
      }

      parts.push({ ETag: etag.replace(/"/g, ''), PartNumber: partNumber })
      onProgress((partNumber / totalParts) * 100)
    }

    // 5️⃣ Complete multipart upload
    const completeMultipartUploadResult = await s3Client.send(
      new CompleteMultipartUploadCommand({
        Bucket: 'public',
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts,
        },
      }),
    )
    log('Multipart upload completed successfully', completeMultipartUploadResult)
    onUploadComplete({ key })
  } catch (err) {
    onError(err)
    if (uploadId) {
      const abortResult = await s3AbortMultipartUploadCommand({ Key: key, UploadId: uploadId })
      log('Abort multipart upload result', abortResult)
    }
    throw err
  }
}

export const s3AbortMultipartUploadCommand = async (params: { Key: string; UploadId: string }) => {
  const result = await s3Client.send(
    new AbortMultipartUploadCommand({
      Bucket: 'public',
      Key: params.Key, // Path where you want to abort the file
      UploadId: params.UploadId,
    }),
  )
  return result
}
