import React, { forwardRef } from 'react'
import { View, Modal } from 'react-native'

import { CustomModalProps } from './ModalProps'
import getStyles from './styles'

import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { heightPercentageToDP } from '@2060/utils/responsiveUtils'

const CustomModal = forwardRef<Modal, CustomModalProps>((modalProps, ref) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  return (
    <Modal
      ref={ref}
      animationType={modalProps.animationType || 'slide'}
      transparent={true}
      supportedOrientations={[
        'portrait',
        'portrait-upside-down',
        'landscape',
        'landscape-left',
        'landscape-right',
      ]}
      {...modalProps}
    >
      <View style={[styles.container, { paddingTop: heightPercentageToDP(modalProps.topHeight || '24%') }]}>
        <View style={[styles.modalFullScreen, modalProps.style]}>{modalProps.children}</View>
      </View>
    </Modal>
  )
})

export default CustomModal
