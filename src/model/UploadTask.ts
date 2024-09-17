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
  private _chunks!: string[]

  public get chunks(): UploadChunkTask[] {
    // eslint-disable-next-line no-underscore-dangle
    return this._chunks.map(item => JSON.parse(item) as UploadChunkTask)
  }

  public set chunks(tasks: UploadChunkTask[]) {
    // eslint-disable-next-line no-underscore-dangle
    this._chunks = tasks.map(item => JSON.stringify(item))
  }

  static schema: ObjectSchema = {
    name: 'UploadTask',
    properties: {
      fileId: { type: 'string' },
      state: { type: 'string' },
      mediaRecordIds: { type: 'list', objectType: 'string' },
      _chunks: { type: 'list', objectType: 'string', optional: true },
    },
    primaryKey: 'fileId',
  }
}
