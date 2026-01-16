import { t } from 'i18next'
import React from 'react'

import ModalConfirmAction from '../ModalConfirmAction'

type Props = {
  visible: boolean
  onClose(): void
  onDeleteChat(): void
  onCancel(): void
  onConfirmSecondary(): void
}

const ConfirmChatDeletion: React.FC<Props> = ({
  visible,
  onClose,
  onDeleteChat,
  onConfirmSecondary,
  onCancel,
}) => {
  return (
    <ModalConfirmAction
      visible={visible}
      title={t('connection.titleDeleteChat')}
      subTitle={t('connection.subTitleDeleteChat')}
      confirmText={t('general.yesDelete')}
      cancelText={'No'}
      onClose={onClose}
      onConfirm={onDeleteChat}
      onCancel={onCancel}
      confirmTextSecondary={t('general.yesDeleteAndConnection')}
      onConfirmSecondary={onConfirmSecondary}
    />
  )
}

export default ConfirmChatDeletion
