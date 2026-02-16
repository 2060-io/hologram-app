import Realm, { ObjectSchema } from 'realm'

import { MediaUploadState } from './MediaUploadState'

export class UploadTask extends Realm.Object<UploadTask> {
  fileId!: string
  mediaRecordIds!: string[]
  state!: MediaUploadState
  chunks!: string[]

  static schema: ObjectSchema = {
    name: 'UploadTask',
    properties: {
      fileId: { type: 'string' },
      state: { type: 'string' },
      mediaRecordIds: { type: 'list', objectType: 'string' },
      chunks: { type: 'list', objectType: 'string' },
    },
    primaryKey: 'fileId',
  }
}
