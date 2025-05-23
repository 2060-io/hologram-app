import Realm, { ObjectSchema } from 'realm'

export class CacheRecord extends Realm.Object<CacheRecord> {
  url!: string
  lastModified!: number
  content!: string

  static schema: ObjectSchema = {
    name: 'CacheRecord',
    properties: {
      url: { type: 'string' },
      content: { type: 'string' },
      lastModified: { type: 'int' },
    },
    primaryKey: 'url',
  }
}
