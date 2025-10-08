import { StackScreenProps } from '@react-navigation/stack'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { Credentials } from '@2060/components'
import { PersonalChatStackParams } from '@2060/components/Navigation/NavigationProps'
import { usePresentCredential } from '@2060/hooks'

interface Props extends StackScreenProps<PersonalChatStackParams, 'PresentCredentialsFromChat'> {}

const PresentCredentialsFromChat = ({ navigation, route }: Props) => {
  const { connectionId } = route.params
  const { t } = useTranslation()
  const { present } = usePresentCredential()

  const presentCredential = useCallback(async (credentialRecordId: string) => {
    present(credentialRecordId, [connectionId], navigation)
  }, [])

  return (
    <Credentials
      navigation={navigation}
      headerTitle={t('credential.present')}
      onPressCredential={presentCredential}
    />
  )
}

export default PresentCredentialsFromChat
