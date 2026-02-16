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
import { getApp } from '@react-native-firebase/app'
import { getToken } from '@react-native-firebase/app-check'
import { XMLParser } from 'fast-xml-parser'

import { log } from '@src/utils/log'

export const BUCKET_NAME = 'public'
export const HOST = 'https://p2800.ovpndev.mobiera.io'
const PART_SIZE = 5 * 1024 * 1024 // 5MB minimum required by S3

type ServerCredentials = {
  AccessKeyId: string
  Expiration: string
  SecretAccessKey: string
  SessionToken: string
}

export const getServerCredentials = async (): Promise<ServerCredentials> => {
  const token = (await getToken(getApp().appCheck())).token
  const params = new URLSearchParams({
    Action: 'AssumeRoleWithCustomToken',
    Version: '2011-06-15',
    Token: token,
    DurationSeconds: '900',
    RoleArn: 'arn:minio:iam:::role/idmp-mobile-app',
  })
  const url = `${HOST}?${params.toString()}`
  const response = await fetch(url, { method: 'POST' })
  const xml = await response.text()
  if (!response.ok) {
    throw new Error(`Error getting STS: ${JSON.stringify(response)}`)
  }
  const parser = new XMLParser()
  const jsonObj = parser.parse(xml) //
  return jsonObj.AssumeRoleWithCustomTokenResponse.AssumeRoleWithCustomTokenResult
    .Credentials as ServerCredentials
}

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
  let uploadId: string | null = null
  let s3Client: S3Client | null = null
  try {
    // create S3 client with temporary credentials from server
    const credentials = await getServerCredentials()
    s3Client = new S3Client({
      endpoint: HOST,
      forcePathStyle: true,
      region: 'us-east-1',
      logger: console,
      credentials: {
        accessKeyId: credentials.AccessKeyId,
        secretAccessKey: credentials.SecretAccessKey,
        sessionToken: credentials.SessionToken,
      },
    })

    // Create multipart upload
    const createRes = await s3Client.send(
      new CreateMultipartUploadCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: 'application/octet-stream',
      }),
    )

    onMultipartCreated()
    uploadId = createRes.UploadId!

    // Get file blob using fetch
    const fileBlob = await fetch(`file://${filePath}`).then(r => r.blob())

    const fileSize = fileBlob.size
    const totalParts = Math.ceil(fileSize / PART_SIZE)

    const parts: { ETag: string; PartNumber: number }[] = []
    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
      // Generate presigned URL for this part
      const presignedUrl = await getSignedUrl(
        s3Client,
        new UploadPartCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          UploadId: uploadId,
          PartNumber: partNumber,
        }),
        { expiresIn: 3_600 },
      )

      // Upload using fetch (fully controlled HTTP layer)
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

    // Complete multipart upload
    const completeMultipartUploadResult = await s3Client.send(
      new CompleteMultipartUploadCommand({
        Bucket: BUCKET_NAME,
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
    if (uploadId && s3Client) {
      const abortResult = await s3AbortMultipartUploadCommand({ s3Client, key, uploadId: uploadId })
      log('Abort multipart upload result', abortResult)
    }
  }
}

const s3AbortMultipartUploadCommand = async (params: {
  s3Client: S3Client
  key: string
  uploadId: string
}) => {
  const result = await params.s3Client.send(
    new AbortMultipartUploadCommand({
      Bucket: BUCKET_NAME,
      Key: params.key,
      UploadId: params.uploadId,
    }),
  )
  return result
}
