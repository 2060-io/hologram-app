import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Credentials } from '@2060/components'
import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'

interface Props extends StackScreenProps<NavigationStackParams, 'Wallet'> {}
const Wallet = ({ navigation }: Props) => {
  const { t } = useTranslation()

  const goToDetails = (credentialRecordId: string) => {
    navigation.navigate('CredentialDetails', { credentialRecordId })
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Credentials
        navigation={navigation}
        headerTitle={t('general.credentials')}
        onPressCredential={goToDetails}
      />
    </SafeAreaView>
  )
}

export default Wallet
