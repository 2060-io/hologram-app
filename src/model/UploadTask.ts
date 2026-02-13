import Realm, { ObjectSchema } from 'realm'

import { MediaUploadState } from './MediaUploadState'

type UploadChunkState = 'pending' | 'finished'

export interface UploadChunkTask {
  id: string
  filePath: string
  state: UploadChunkState
}

export class UploadTask extends Realm.Object<UploadTask> {
  fileId!: string
  mediaRecordIds!: string[]
  state!: MediaUploadState
  uploadFilePath!: string

  static schema: ObjectSchema = {
    name: 'UploadTask',
    properties: {
      fileId: { type: 'string' },
      state: { type: 'string' },
      mediaRecordIds: { type: 'list', objectType: 'string' },
      uploadFilePath: { type: 'string' },
    },
    primaryKey: 'fileId',
  }
}
