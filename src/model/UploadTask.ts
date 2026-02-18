import Realm, { ObjectSchema } from 'realm'

import { MediaUploadState } from './MediaUploadState'

export class UploadTask extends Realm.Object<UploadTask> {
  fileId!: string
  mediaRecordIds!: string[]
  state!: MediaUploadState
  private _chunks!: string[]

  public get chunks(): string[] {
    // eslint-disable-next-line no-underscore-dangle
    return this._chunks
  }

  public set chunks(chunks: string[]) {
    // eslint-disable-next-line no-underscore-dangle
    this._chunks = chunks
  }

  static schema: ObjectSchema = {
    name: 'UploadTask',
    properties: {
      fileId: { type: 'string' },
      state: { type: 'string' },
      mediaRecordIds: { type: 'list', objectType: 'string' },
      _chunks: { type: 'list', objectType: 'string' },
    },
    primaryKey: 'fileId',
  }
}
