import { stringToStringDate } from '@src/utils/dateUtils'

/* eslint-disable max-len */
type CredentialAttributeRowString = {
  key: string
  type: 'string'
  value: string
}

type CredentialAttributeRowImage = {
  key: string
  type: 'image'
  image: string
}

type CredentialAttributeRowImageAndString = {
  key: string
  type: 'imageAndString'
  value: string
  image: string
}

export type CredentialAttributeRow =
  | CredentialAttributeRowString
  | CredentialAttributeRowImage
  | CredentialAttributeRowImageAndString

export type CredentialAttributeTable = {
  title?: string
  rows: CredentialAttributeRow[]
  depth: number // depth level
  parent?: string // parent name
}

const transformToDateIfItIs = (key: string, value: string) => {
  const couldBeADate = value.length === 8 && key.toLowerCase().includes('date')
  if (couldBeADate) return stringToStringDate(value)
  return value
}

type FormatCredentialSubject = {
  subject: Record<string, unknown>
  depth?: number
  parent?: string
  title?: string
}
/**
 * Formats the subject of a credential into a tables to display attributes.
 *
 * @param subject the credential subject from a W3C credential.
 * @param depth the current depth of the nested objects within the credential subject. Starts at 0 for the top-level object.
 * @param parent the title of the parent object of the current nested object. Undefined for the top-level object.
 * @param title the title of the current nested object. This corresponds to the key of the nested object within the parent object.
 * @returns an array of CredentialAttributeTable objects, each representing a table with rows of key-value pairs. Nested objects are represented as separate tables.
 */
export function formatCredentialSubject(args: FormatCredentialSubject): CredentialAttributeTable[] {
  const { subject, depth = 0, parent, title } = args
  const stringRows: CredentialAttributeRow[] = []
  const objectTables: CredentialAttributeTable[] = []

  Object.keys(subject).forEach((key) => {
    if (key === 'id' || key === 'type') return // omit id and type

    const value = subject[key]

    if (typeof value === 'number') {
      stringRows.push({
        key,
        value: transformToDateIfItIs(key, `${value}`),
        type: 'string',
      })
    } else if (typeof value === 'string' && value.startsWith('data:image/')) {
      stringRows.push({
        key,
        image: value,
        type: 'image',
      })
    } else if (typeof value === 'string') {
      stringRows.push({
        key,
        value: transformToDateIfItIs(key, value),
        type: 'string',
      })
    }
    // FIXME: Handle arrays
    else if (typeof value === 'object' && value !== null) {
      // Special handling for image
      if ('type' in value && value.type === 'Image') {
        if ('id' in value && typeof value.id === 'string') {
          stringRows.push({
            key,
            image: value.id,
            type: 'image',
          })
        }
      } else {
        objectTables.push(
          ...formatCredentialSubject({
            subject: value as Record<string, unknown>,
            depth: depth + 1,
            parent: title,
            title,
          })
        )
      }
    }
  })

  const tableData: CredentialAttributeTable[] = [{ title, rows: stringRows, depth, parent }, ...objectTables]

  return tableData
    .filter((table) => table.rows.length > 0)
    .map((table) => {
      // Special rendering for OpenBadgeCredentials, which include a single 'image' and 'name'
      // We'll combine both into an 'imageAndString' to make it look nicer
      const imageKeyValue = 'image'
      const nameKeyValue = 'name'
      const firstImageIndex = table.rows.findIndex((row) => row.type === 'image' && row.key === imageKeyValue)
      const firstStringIndex = table.rows.findIndex((row) => row.type === 'string' && row.key === nameKeyValue)
      let rows = table.rows

      if (
        firstImageIndex !== -1 &&
        firstStringIndex !== -1 &&
        // Due to recursive call, it could be that the rows already contain a combined row
        table.rows[0]?.type !== 'imageAndString'
      ) {
        const stringRow = table.rows[firstStringIndex] as CredentialAttributeRowString
        const imageRow = table.rows[firstImageIndex] as CredentialAttributeRowImage

        const imageAndStringRow = {
          type: 'imageAndString',
          image: imageRow.image,
          key: stringRow.key,
          value: stringRow.value,
        } satisfies CredentialAttributeRowImageAndString

        // Remove the image and string rows and replace with the combined row
        rows = [imageAndStringRow, ...table.rows.filter((row) => row !== imageRow && row !== stringRow)]
      }

      return {
        ...table,
        // Sort the rows so that imageAndString rows are first, followed by string rows, followed by image rows
        rows: rows.sort((a, b) => {
          const order = ['imageAndString', 'image', 'string']
          return order.indexOf(a.type) - order.indexOf(b.type)
        }),
      }
    })
}
