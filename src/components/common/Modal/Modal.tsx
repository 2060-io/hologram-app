import React, { forwardRef } from 'react'
import { Modal } from 'react-native'

import { CustomModalProps } from './ModalProps'

const CustomModal = forwardRef<Modal, CustomModalProps>((modalProps, ref) => {
  return (
    <Modal ref={ref} statusBarTranslucent {...modalProps}>
      {modalProps.children}
    </Modal>
  )
})

export default CustomModal
