import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { Credentials } from '@2060/components'
import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'

interface Props extends StackScreenProps<NavigationStackParams, 'Wallet'> {}
const Wallet = ({ navigation }: Props) => {
  const { t } = useTranslation()

  const goToDetails = (credentialRecordId: string) => {
    navigation.navigate('CredentialDetails', { credentialRecordId })
  }

  return (
    <Credentials
      navigation={navigation}
      headerTitle={t('general.credentials')}
      onPressCredential={goToDetails}
    />
  )
}

export default Wallet
