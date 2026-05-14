import { createResizedImage, LOCAL_PREVIEW_IMAGE_QUALITY, LOCAL_PREVIEW_IMAGE_WIDTH } from '@src/hooks/media/preview'
import { useLocalRealm } from '@src/hooks/providers/RealmProvider'
import { useRefreshedAvatarsUrls } from '@src/hooks/providers/RefreshedAvatarsUrlsProvider'
import { CacheRecord } from '@src/model'
import { logError } from '@src/utils'
import { deleteFile } from '@src/utils/RNFS'
import axios from 'axios'
import { useCallback, useEffect, useRef, useState } from 'react'

const downloadImage = async (url: string) => {
  try {
    const resizedImage = await createResizedImage({
      imageUrl: url,
      maxWidth: LOCAL_PREVIEW_IMAGE_WIDTH,
      maxHeight: LOCAL_PREVIEW_IMAGE_WIDTH,
      quality: LOCAL_PREVIEW_IMAGE_QUALITY,
    })
    if (!resizedImage) return null
    deleteFile(resizedImage.path)
    return resizedImage.base64
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
  enableImageRefresh: boolean
}

export const useImage = ({ uri, onError, onImageContent, enableImageRefresh }: Props) => {
  const { realm } = useLocalRealm()
  const [imageContent, setImageContent] = useState<string | null>(null)
  const wasAvatarRefreshedHere = useRef(false)
  const { refreshedAvatarsUrlsList, updateRefreshedAvatarsUrlsList } = useRefreshedAvatarsUrls()

  useEffect(() => {
    if (imageContent) onImageContent(imageContent)
  }, [imageContent])

  useEffect(() => {
    const downloadAndSaveImageRecord = async () => {
      const imageDataUrl = await downloadImage(uri)
      if (imageDataUrl) {
        setImageContent(imageDataUrl)
        afterSaveOrUpdate()
        saveImageRecord({ url: uri, content: imageDataUrl })
      } else {
        onError()
      }
    }

    const downloadAndUpdateImageRecord = async (imageRecord: CacheRecord, originLastModified: number) => {
      const newImageDataUrl = await downloadImage(uri)
      if (newImageDataUrl) {
        setImageContent(newImageDataUrl)
        afterSaveOrUpdate()
        updateImageRecord({ imageRecord, newContent: newImageDataUrl, lastModified: originLastModified })
      }
    }

    const afterSaveOrUpdate = () => {
      wasAvatarRefreshedHere.current = true
      updateRefreshedAvatarsUrlsList(uri)
    }

    const checkIfImageNeedsUpdate = async (imageRecord: CacheRecord) => {
      const originLastModified = await fetchLastModified(uri)
      if (!originLastModified) return
      const needsUpdate = imageRecord.lastModified < originLastModified
      if (needsUpdate) downloadAndUpdateImageRecord(imageRecord, originLastModified)
    }

    const checkImage = async () => {
      const imageRecord = findImageRecord(uri)
      if (imageRecord) {
        setImageContent(imageRecord.content)
        if (enableImageRefresh) checkIfImageNeedsUpdate(imageRecord)
      } else {
        downloadAndSaveImageRecord()
      }
    }
    checkImage()
  }, [])

  useEffect(() => {
    const checkIfNeedRefresh = () => {
      if (wasAvatarRefreshedHere.current) return
      const wasRefreshed = refreshedAvatarsUrlsList.includes(uri)
      if (wasRefreshed) {
        const imageRecord = findImageRecord(uri)
        if (imageRecord) {
          setImageContent(imageRecord.content)
        }
      }
    }
    checkIfNeedRefresh()
  }, [refreshedAvatarsUrlsList])

  const findImageRecord = useCallback(
    (url: string) => {
      return realm ? realm.objects(CacheRecord).find((item) => item.url === url) : undefined
    },
    [realm]
  )

  const saveImageRecord = useCallback(
    (image: { url: string; content: string }) => {
      if (!realm) return
      realm.write(() => {
        return new CacheRecord(realm, {
          url: image.url,
          content: image.content,
          lastModified: new Date().getTime(),
        })
      })
    },
    [realm]
  )

  const updateImageRecord = useCallback(
    (args: { imageRecord: CacheRecord; newContent: string; lastModified: number }) => {
      if (!realm) return
      const { imageRecord, newContent, lastModified } = args
      realm.write(() => {
        imageRecord.content = newContent
        imageRecord.lastModified = lastModified
      })
    },
    [realm]
  )

  return {
    imageContent,
  }
}
