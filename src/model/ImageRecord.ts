import Realm, { ObjectSchema } from 'realm'

export class ImageRecord extends Realm.Object<ImageRecord> {
  id!: string
  url!: string
  lastModified!: number
  content!: string

  static schema: ObjectSchema = {
    name: 'ImageRecord',
    properties: {
      id: { type: 'string' },
      url: { type: 'string' },
      content: { type: 'string' },
      lastModified: { type: 'int' },
    },
    primaryKey: 'id',
  }
}
