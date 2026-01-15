import { StackScreenProps } from '@react-navigation/stack'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import getStyles from './styles'

import { CredentialDetails as CredentialDetailsComponent, ModalConfirmAction } from '@2060/components'
import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { Text, ServiceInformation, OptionsList } from '@2060/components/common'
import { Option } from '@2060/components/common/OptionsList'
import { useCredentials, useMobileAgent } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { getCredentialDetailsForDisplay } from '@2060/services/agent/display'

interface Props extends StackScreenProps<NavigationStackParams, 'CredentialDetails'> {}
const CredentialDetails = ({ route, navigation }: Props) => {
  const { credentialRecordId } = route.params
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { agent } = useMobileAgent()
  const { getCredentialById } = useCredentials()
  const [showConfirmationDeleteModal, setShowConfirmationDeleteModal] = useState(false)
  const credentialRecord = getCredentialById(credentialRecordId)
  const credentialDetails = credentialRecord ? getCredentialDetailsForDisplay(credentialRecord) : undefined

  const did = credentialRecord?.credential.issuerId ?? ''

  const hideConfirmationDeleteModal = () => setShowConfirmationDeleteModal(false)

  const deleteCredential = async () => {
    if (credentialDetails) {
      await agent?.w3cCredentials.removeCredentialRecord(credentialDetails.mainInfo.id)
    }
    hideConfirmationDeleteModal()
    navigation.goBack()
  }

  const onPressPresentCredential = () => {
    navigation.navigate('SelectCredentialAttributes', { presentDirectly: false, credentialRecordId })
  }

  const options: Option[] = [
    {
      iconName: 'id',
      text: t('credential.present'),
      onPress: onPressPresentCredential,
    },
    {
      iconName: 'trash',
      text: t('credential.delete'),
      onPress: () => setShowConfirmationDeleteModal(true),
    },
  ]
  if (!credentialDetails) return null
  return (
    <>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.subContainer}>
            <CredentialDetailsComponent
              credentialDetails={credentialDetails}
              middleInfo={
                <View style={styles.optionsContainer}>
                  <OptionsList options={options} />
                </View>
              }
            />
            <Text fontFamily="EuclidCircularA-SemiBold" style={styles.titleIssuerInfo}>
              {t('credentialOffer.issuerInformation')}
            </Text>
            <ServiceInformation did={did} />
          </View>
        </ScrollView>
      </SafeAreaView>
      <ModalConfirmAction
        visible={showConfirmationDeleteModal}
        title={`${t('credential.deleteConfirmation')} ${credentialDetails?.mainInfo.schemaName}`}
        subTitle={t('credential.deleteConfirmationDescription')}
        confirmText={t('credential.yesDelete')}
        cancelText="No"
        onClose={hideConfirmationDeleteModal}
        onConfirm={deleteCredential}
        onCancel={hideConfirmationDeleteModal}
      />
    </>
  )
}

export default CredentialDetails
