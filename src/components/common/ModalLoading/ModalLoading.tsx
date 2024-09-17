import React from 'react'

import Loader from '../Loader'
import Modal from '../Modal'

import styles from './styles'

type Props = {
  visible: boolean
  message?: string
}

const ModalLoading = ({ visible, message }: Props) => {
  return (
    <Modal visible={visible} topHeight="0%" style={styles.container}>
      <Loader message={message} />
    </Modal>
  )
}

export default ModalLoading
