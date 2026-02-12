import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  UploadPartCommandOutput,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { Buffer } from '@credo-ts/core'
import { readFile } from 'react-native-fs'

import { log, logError } from '@src/utils'

import 'react-native-get-random-values'
import 'react-native-url-polyfill/auto'
import 'web-streams-polyfill/dist/polyfill'

const bucketName = 'public'

// Set the credential of aws
const s3Client = new S3Client({
  endpoint: 'https://s3.minio.dev.2060.io',
  forcePathStyle: true,
  region: 'us-east-1',
  logger: console,
  credentials: {
    accessKeyId: 'KNRM2IC4CJR0RBKTWOSE',
    secretAccessKey: 'faIvtfG7x+B13QJLFItrjDYcdgfzjnkCcag0Srq3',
    sessionToken:
      'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3NLZXkiOiJLTlJNMklDNENKUjBSQktUV09TRSIsImV4cCI6MTc3MDk1ODQyNywicGFyZW50IjoiYWRtaW4ifQ.7U1TFNLPZ1lTA5-cZKpJtONEBrSyvrnPVRLL6y2Miqlml59n5TmDDS1XRo5glP59-27HQYc64uk43dGE_sZnRw',
  },
})

export const s3PutObjectCommand = async () => {
  const str = 'Hello, this is a test file for AWS S3 multipart upload.'.repeat(10)
  const encoder = new TextEncoder()
  const buffer = encoder.encode(str)
  try {
    const response = await s3Client.send(
      new PutObjectCommand({
        Bucket: 'public',
        Key: 'danirico.txt',
        Body: buffer,
        ContentType: 'text/plain',
        ContentLength: buffer.length,
      }),
    )
    log('s3PutObjectCommand response', response)
  } catch (caught) {
    if (caught instanceof Error && caught.name === 'AbortError') {
      logError(`Multipart upload was aborted. ${caught.message}`)
    } else {
      logError('S3 upload error:', caught)
    }
  }
}

export const s3Upload = async (params: { Key: string; filePath: string }) => {
  try {
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: 'public',
        Key: params.Key,
        Body: Buffer.from(await readFile(params.filePath, 'base64'), 'base64'),
      },
      queueSize: 4, // optional concurrency configuration
      partSize: 5 * 1024 * 1024, // optional size of each part
      leavePartsOnError: false, // optional manually handle dropped parts
    })

    upload.on('httpUploadProgress', ({ loaded, total }) => {
      log('httpUploadProgress', { current: loaded, total })
    })

    const response = await upload.done()
    log('Upload completed successfully', response)
    return response
  } catch (caught) {
    if (caught instanceof Error && caught.name === 'AbortError') {
      logError(`Multipart upload was aborted. ${caught.message}`)
    } else {
      throw caught
    }
  }
}

export const s3createMultipartUploadCommand = async (params: { Key: string }) => {
  const multipartUpload = await s3Client.send(
    new CreateMultipartUploadCommand({
      Bucket: bucketName,
      Key: params.Key, // Path where you want to save the file
    }),
  )
  return multipartUpload
}

export const s3UploadPartCommand = async (params: {
  Key: string
  uploadId: string
  partNumber: number
  chunkFilePath: string
}) => {
  try {
    const chunkBody = Buffer.from(await readFile(params.chunkFilePath, 'base64'), 'base64')
    const result = await s3Client.send(
      new UploadPartCommand({
        Bucket: bucketName,
        Key: params.Key,
        UploadId: params.uploadId,
        Body: chunkBody,
        PartNumber: params.partNumber,
      }),
    )
    return result
  } catch (error) {
    const abortResult = await s3AbortMultipartUploadCommand({ Key: params.Key, UploadId: params.uploadId })
    log('abort multipart upload result', abortResult)
    throw error
  }
}

export const s3AbortMultipartUploadCommand = async (params: { Key: string; UploadId: string }) => {
  const result = await s3Client.send(
    new AbortMultipartUploadCommand({
      Bucket: bucketName,
      Key: params.Key, // Path where you want to abort the file
      UploadId: params.UploadId,
    }),
  )
  return result
}

export const s3CompleteMultipartUploadCommand = async (params: {
  Key: string
  UploadId: string
  uploadResults: UploadPartCommandOutput[]
}) => {
  const result = await s3Client.send(
    new CompleteMultipartUploadCommand({
      Bucket: bucketName,
      Key: params.Key, // Path where you want to save the file
      UploadId: params.UploadId,
      MultipartUpload: {
        Parts: params.uploadResults.map(({ ETag }, i) => ({
          ETag,
          PartNumber: i + 1,
        })),
      },
    }),
  )
  return result
}
