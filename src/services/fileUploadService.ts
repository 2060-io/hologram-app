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
import { CacheModuleConfig } from '@credo-ts/core'
import { getApp } from '@react-native-firebase/app'
import { getToken } from '@react-native-firebase/app-check'
import { XMLParser } from 'fast-xml-parser'
import { uploadFiles } from '@dr.pogodin/react-native-fs'

import { MobileAgent } from './agent/MobileAgent'

import { log } from '@src/utils/log'

export const BUCKET_NAME = 'hologram-media-sharing'

type S3ServerCredentials = {
  AccessKeyId: string
  Expiration: string
  SecretAccessKey: string
  SessionToken: string
}

async function storeS3Credentials(agent: MobileAgent, s3ServerCredentials: S3ServerCredentials) {
  const cache = agent.dependencyManager.resolve(CacheModuleConfig).cache
  await cache.set<S3ServerCredentials>(agent.context, 'S3ServerCredentials', s3ServerCredentials)
}

async function getStoredS3Credentials(agent: MobileAgent) {
  const cache = agent.dependencyManager.resolve(CacheModuleConfig).cache
  return await cache.get<S3ServerCredentials>(agent.context, 'S3ServerCredentials')
}

async function getS3ServerCredentials(s3ServerUrl: string, agent: MobileAgent): Promise<S3ServerCredentials> {
  const storedCredentials = await getStoredS3Credentials(agent)
  const isTokenValid = storedCredentials && new Date(storedCredentials.Expiration) > new Date(Date.now())
  if (isTokenValid) return storedCredentials

  const firebaseToken = (await getToken(getApp().appCheck())).token
  const params = new URLSearchParams({
    Action: 'AssumeRoleWithCustomToken',
    Version: '2011-06-15',
    Token: firebaseToken,
    DurationSeconds: '900',
    RoleArn: 'arn:minio:iam:::role/idmp-mobile-app',
  })
  const url = `${s3ServerUrl}?${params.toString()}`
  const response = await fetch(url, { method: 'POST' })
  const xml = await response.text()
  if (!response.ok) {
    throw new Error(`Error getting STS: ${JSON.stringify(response)}`)
  }
  const parser = new XMLParser()
  const jsonObj = parser.parse(xml)
  const newS3Credentials = jsonObj.AssumeRoleWithCustomTokenResponse.AssumeRoleWithCustomTokenResult
    .Credentials as S3ServerCredentials
  await storeS3Credentials(agent, newS3Credentials)
  return newS3Credentials
}

/**
 * Uploads a file to S3 using multipart upload with progress tracking.
 * If an error occurs during upload, the multipart session is automatically aborted.
 * @param agent - The MobileAgent instance
 * @param s3ServerUrl - The S3 server URL to upload to
 * @param chunks - An array of file paths representing the chunks to upload
 * @param key - The S3 object key (path) where the file will be stored
 * @param onMultipartCreated - Callback invoked when the multipart upload session is created
 * @param onProgress - Callback invoked with upload progress as a percentage (0-100)
 * @param onError - Callback invoked if an error occurs during upload
 * @param onUploadComplete - Callback invoked with the result when upload completes successfully
 * @throws {Error} If file upload fails, part upload fails, ETag is missing, or multipart completion fails
 */
export async function s3UploadFile({
  agent,
  s3ServerUrl,
  chunks,
  key,
  onMultipartCreated,
  onProgress,
  onError,
  onUploadComplete,
}: {
  agent: MobileAgent
  s3ServerUrl: string
  chunks: string[]
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
    const s3Credentials = await getS3ServerCredentials(s3ServerUrl, agent)
    s3Client = new S3Client({
      endpoint: s3ServerUrl,
      forcePathStyle: true,
      region: 'us-east-1',
      logger: console,
      credentials: {
        accessKeyId: s3Credentials.AccessKeyId,
        secretAccessKey: s3Credentials.SecretAccessKey,
        sessionToken: s3Credentials.SessionToken,
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
    log(`Upload file id ${uploadId} start`)

    const parts: { ETag: string; PartNumber: number }[] = []
    for (let partNumber = 1; partNumber <= chunks.length; partNumber++) {
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

      // Upload using uploadFiles from react-native-fs to stream file directly from disk (no JS buffer)
      const chunkFilePath = chunks[partNumber - 1]
      const uploadResult = await uploadFiles({
        toUrl: presignedUrl,
        files: [
          {
            name: 'file',
            filename: `part-${partNumber}`,
            filepath: chunkFilePath.slice(1), // removes '/' from path, which is required by react-native-fs,
            filetype: 'application/octet-stream',
          },
        ],
        method: 'PUT',
        headers: { 'Content-Type': 'application/octet-stream' },
        binaryStreamOnly: true,
      }).promise

      if (uploadResult.statusCode < 200 || uploadResult.statusCode >= 300) {
        throw new Error(
          'Upload failed for presignedUrl ' +
            presignedUrl +
            ' partNumber: ' +
            partNumber +
            ' With the next result: ' +
            JSON.stringify(uploadResult),
        )
      }
      // Parse ETag from response headers
      const responseHeaders = uploadResult.headers as Record<string, string>
      const etag = responseHeaders.ETag || responseHeaders.Etag
      if (!etag) {
        throw new Error('ETag missing from upload response')
      }

      parts.push({ ETag: etag.replace(/"/g, ''), PartNumber: partNumber })
      onProgress((partNumber / chunks.length) * 100)
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
      const abortResult = await s3AbortMultipartUploadCommand({ s3Client, key, uploadId })
      log('Abort multipart upload result', abortResult)
    }
  }
}

async function s3AbortMultipartUploadCommand(params: { s3Client: S3Client; key: string; uploadId: string }) {
  const result = await params.s3Client.send(
    new AbortMultipartUploadCommand({
      Bucket: BUCKET_NAME,
      Key: params.key,
      UploadId: params.uploadId,
    }),
  )
  return result
}
