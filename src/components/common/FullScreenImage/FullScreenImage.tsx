import React from 'react'
import { Image, View, TouchableWithoutFeedback } from 'react-native'

import Modal from '../Modal'
import SvgIcon from '../SvgIcon'

import styles from './styles'

type Props = {
  showFullScreenImage: boolean
  closeFullScreenImage: () => void
  imageUri: string
}

const FullScreenImage = ({ showFullScreenImage, closeFullScreenImage, imageUri }: Props) => {
  return (
    <Modal animationType="fade" transparent visible={showFullScreenImage}>
      <TouchableWithoutFeedback onPress={closeFullScreenImage}>
        <View style={styles.container}>
          <SvgIcon name="close" width={30} height={30} fill="white" style={styles.closeIcon} />
          <Image style={styles.image} resizeMode="contain" source={{ uri: imageUri }} />
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

export default FullScreenImage
