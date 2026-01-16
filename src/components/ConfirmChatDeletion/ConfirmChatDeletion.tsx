import { t } from 'i18next'
import React from 'react'

import ModalConfirmAction from '../ModalConfirmAction'

type Props = {
  onClose(): void
  onDeleteChat(): void
  onCloseContextMenu(): void
  onConfirmSecondary(): void
}

const ConfirmChatDeletion: React.FC<Props> = ({
  onClose,
  onDeleteChat,
  onConfirmSecondary,
  onCloseContextMenu,
}) => {
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
      confirmTextSecondary={'Yes, and delete connection, too'}
      onConfirmSecondary={onConfirmSecondary}
    />
  )
}

export default ConfirmChatDeletion
