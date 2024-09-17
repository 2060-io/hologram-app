import React, { useState } from 'react'
import { View, Image, TouchableOpacity } from 'react-native'

import VideoPlayer from '../VideoChatView/VideoPlayer'

import AddCommentInput from './AddCommentInput'
import styles from './styles'

import { LightboxModal } from '@2060/components'
import { Icon } from '@2060/components/common'
import { whiteColor } from '@2060/constants'
import { ImageOrVideo, useChatActions } from '@2060/hooks'

// FIXME: This view is not used after removing its usage to fix the issue #118.
// An issue #124 for refactoring image picking UI has been created.
type Props = {
  userName: string
  mediaFileInfo: ImageOrVideo | null
  showModalToAddDescription: boolean
  onCloseModalToAddDescription(): void
}

const AddDescriptionFileMediaView = ({
  userName,
  mediaFileInfo,
  showModalToAddDescription,
  onCloseModalToAddDescription,
}: Props) => {
  const [showControl, setShowControl] = useState(true)
  const { shareMediaToDidComm } = useChatActions()

  const onSendSharedFile = (comment: string) => {
    const { mime, filename, path, size, duration, preview } = mediaFileInfo!

    onCloseModalToAddDescription()
    shareMediaToDidComm({
      mime,
      fileName: filename,
      path,
      size,
      duration: duration ?? undefined,
      preview,
      description: comment,
    })
  }

  if (!mediaFileInfo) return null

  const isImageFile = mediaFileInfo.mime.startsWith('image')
  const isVideoFile = mediaFileInfo.mime.startsWith('video')

  return (
    <LightboxModal
      visible={showModalToAddDescription}
      onCloseModal={onCloseModalToAddDescription}
      renderHeader={onClose => (
        <View style={styles.containerBgClose}>
          <TouchableOpacity onPress={onClose} style={styles.btnClose}>
            <Icon as="Ionicons" name="close" size={40} color={whiteColor} />
          </TouchableOpacity>
        </View>
      )}
    >
      <View style={{ height: '100%' }}>
        {isImageFile && <Image source={{ uri: mediaFileInfo.path }} style={styles.image} />}
        {isVideoFile && mediaFileInfo && (
          <VideoPlayer
            uri={mediaFileInfo.path}
            showControl={showControl}
            setShowControl={setShowControl}
            initialPlay={false}
            showProgressBar={false}
          />
        )}
        <AddCommentInput userName={userName} onSend={onSendSharedFile} />
      </View>
    </LightboxModal>
  )
}

export default AddDescriptionFileMediaView
