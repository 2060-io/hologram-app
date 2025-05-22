import { utils } from '@credo-ts/core'
import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'

import { useLocalRealm } from '@2060/hooks/providers/RealmProvider'
import { ImageRecord } from '@2060/model'
import { logError, dataUrl } from '@2060/utils'

const downloadImage = async (url: string) => {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' })
    const base64 = Buffer.from(response.data, 'binary').toString('base64')
    return dataUrl(response.headers['content-type'], base64)
  } catch (error) {
    logError(`Error downloading image from ${url}: ${error}`)
    return null
  }
}

const fetchLastModified = async (url: string) => {
  try {
    const response = await axios.head(url)
    const lastModified = response.headers['last-modified']
    return new Date(lastModified).getTime()
  } catch (error) {
    logError(`Error fetching HEAD from ${url}: ${error}`)
    return null
  }
}

type Props = {
  uri: string
  onError: () => void
  onImageContent: (imageContent: string) => void
}

export const useImage = ({ uri, onError, onImageContent }: Props) => {
  const { realm } = useLocalRealm()
  const [imageContent, setImageContent] = useState<string | null>(null)

  useEffect(() => {
    if (imageContent) onImageContent(imageContent)
  }, [imageContent])

  useEffect(() => {
    const downloadAndSaveImageRecord = async () => {
      const imageDataUrl = await downloadImage(uri)
      if (imageDataUrl) {
        setImageContent(imageDataUrl)
        saveImageRecord({ url: uri, content: imageDataUrl })
      } else {
        onError()
      }
    }

    const downloadAndUpdateImageRecord = async (imageRecord: ImageRecord) => {
      const newImageDataUrl = await downloadImage(uri)
      if (newImageDataUrl) {
        setImageContent(newImageDataUrl)
        updateImageRecord({ imageRecord, newContent: newImageDataUrl })
      }
    }

    const checkIfImageNeedsUpdate = async (imageRecord: ImageRecord) => {
      const originLastModified = await fetchLastModified(uri)
      if (!originLastModified) return
      const needsUpdate = imageRecord.lastModified <= originLastModified
      if (needsUpdate) downloadAndUpdateImageRecord(imageRecord)
    }

    const checkImage = async () => {
      const imageRecord = findImageRecord(uri)
      if (imageRecord) {
        setImageContent(imageRecord.content)
        checkIfImageNeedsUpdate(imageRecord)
      } else {
        downloadAndSaveImageRecord()
      }
    }
    checkImage()
  }, [])

  const findImageRecord = useCallback(
    (url: string) => {
      return realm ? realm.objects(ImageRecord).find(item => item.url === url) : undefined
    },
    [realm],
  )

  const saveImageRecord = useCallback(
    (image: { url: string; content: string }) => {
      if (!realm) return
      realm.write(() => {
        return new ImageRecord(realm, {
          id: utils.uuid(),
          url: image.url,
          content: image.content,
          lastModified: new Date().getTime(),
        })
      })
    },
    [realm],
  )

  const updateImageRecord = useCallback(
    (image: { imageRecord: ImageRecord; newContent: string }) => {
      if (!realm) return
      const { imageRecord, newContent } = image
      realm.write(() => {
        imageRecord.content = newContent
        imageRecord.lastModified = new Date().getTime()
      })
    },
    [realm],
  )

  return {
    imageContent,
  }
}
