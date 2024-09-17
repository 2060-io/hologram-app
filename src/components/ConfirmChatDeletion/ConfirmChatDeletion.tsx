import { t } from 'i18next'
import React from 'react'

import ModalConfirmAction from '../ModalConfirmAction'

type Props = {
  onClose(): void
  onDeleteChat(): void
  onCloseContextMenu(): void
}

const ConfirmChatDeletion: React.FC<Props> = ({ onClose, onDeleteChat, onCloseContextMenu }) => {
  return (
    <ModalConfirmAction
      visible={true}
      title={t('connection.titleDeleteChat')}
      subTitle={t('connection.subTitleDeleteChat')}
      confirmText={t('chat.yesDelete')}
      cancelText={'No'}
      onClose={onClose}
      onConfirm={onDeleteChat}
      onCancel={onCloseContextMenu}
    />
  )
}

export default ConfirmChatDeletion
