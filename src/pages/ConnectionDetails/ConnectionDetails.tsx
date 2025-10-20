import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View, Image } from 'react-native'
import { uses24HourClock } from 'react-native-localize'

import BaseConnectionDetails, { ConnectionDetailsProps, WrapperProps } from './BaseConnectionDetails'
import ConnectionDetailsForService from './ConnectionDetailsForService'
import getStyles from './styles'

import { Avatar, FullScreenImage, Text } from '@2060/components/common'
import { useConnectionById } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import {
  getConnectionDisplayName,
  getConnectionDisplayPicture,
  getConnectionParentId,
  isService,
} from '@2060/utils/connectionUtils'
import { dateToString } from '@2060/utils/dateUtils'

const validateConnectionExists = () => {
  const Wrapper = (props: WrapperProps) => {
    const { connectionId } = props.route.params
    const connection = useConnectionById(connectionId)
    if (!connection) return null
    const isConnectionService = isService(connection)
    const DetailsComponent = isConnectionService ? ConnectionDetailsForService : ConnectionDetails
    return <DetailsComponent {...props} connection={connection} />
  }
  return Wrapper
}

const ConnectionDetails = (props: ConnectionDetailsProps) => {
  const { connection } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const { t } = useTranslation()
  const hasDisplayPicture = getConnectionDisplayPicture(connection)
  const connectionName = getConnectionDisplayName(connection)
  const parentConnectionId = getConnectionParentId(connection)
  const connectionParent = useConnectionById(parentConnectionId)
  const parentConnectionPicture = connectionParent ? getConnectionDisplayPicture(connectionParent) : ''
  const parentConnectionName = connectionParent ? getConnectionDisplayName(connectionParent) : ''

  const [using24HourFormat, setUsing24HourFormat] = useState<boolean>(false)
  const [showFullScreenImage, setShowFullScreenImage] = useState<boolean>(false)
  const imageFullScreenUri = useRef<string | undefined>(undefined)

  useEffect(() => {
    setUsing24HourFormat(uses24HourClock())
  }, [])

  const onAvatarImagePressed = (avatarImageUri: string) => {
    setShowFullScreenImage(true)
    imageFullScreenUri.current = avatarImageUri
  }
  const closeFullScreenImage = () => setShowFullScreenImage(false)

  return (
    <>
      <FullScreenImage
        showFullScreenImage={showFullScreenImage}
        closeFullScreenImage={closeFullScreenImage}
        imageUri={imageFullScreenUri.current!}
      />
      <BaseConnectionDetails
        {...props}
        mainInfo={
          <View style={styles.mainInfoContainer}>
            <View style={styles.containerSectionInfo}>
              <View style={styles.containerAvatar}>
                <Avatar
                  uri={hasDisplayPicture}
                  label={connectionName}
                  size="25%"
                  onImagePressed={onAvatarImagePressed}
                />
              </View>
              {parentConnectionId && (
                <View style={styles.relatedConnectionContainer}>
                  <Text typography={'EuclidCircularA-Regular'} style={styles.connectionRelatedToText}>
                    {t('connection.connectionManagedBy')}
                  </Text>
                  {parentConnectionPicture.length > 0 && (
                    <Image source={{ uri: parentConnectionPicture }} style={styles.connectionRelatedToImg} />
                  )}
                  <Text typography={'EuclidCircularA-Regular'} style={styles.connectionRelatedToText}>
                    {parentConnectionName}
                  </Text>
                </View>
              )}
              <Text style={styles.createdAtText}>
                {t('connection.connectionCreated', {
                  date: dateToString(connection.createdAt, 'DD/MM/YYYY'),
                  hours: dateToString(connection.createdAt, using24HourFormat ? 'HH:mm' : 'h:mm a'),
                })}
              </Text>
            </View>
          </View>
        }
      />
    </>
  )
}

export default validateConnectionExists()
