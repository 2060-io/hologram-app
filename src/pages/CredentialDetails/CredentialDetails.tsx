import { StackScreenProps } from '@react-navigation/stack'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshControl, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import getStyles from './styles'

import { CredentialDetails as CredentialDetailsComponent, ModalConfirmAction } from '@src/components'
import { NavigationStackParams } from '@src/components/Navigation/NavigationProps'
import { Text, ServiceMainInfoAndProofOfTrust, OptionsList } from '@src/components/common'
import { Option } from '@src/components/common/OptionsList'
import { useCredentials, useMobileAgent } from '@src/hooks/agent'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { useFetchServiceInfo } from '@src/hooks/useFetchServiceInfo'
import { getCredentialDetailsForDisplay } from '@src/services/agent/display'

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
  const did = credentialRecord?.firstCredential.issuerId ?? ''
  const { isFetchingInfo, serviceInfo, failedFetchInfo, getServiceInfo } = useFetchServiceInfo(did)

  const refreshServiceInfo = useCallback(() => {
    getServiceInfo()
  }, [])

  const hideConfirmationDeleteModal = () => setShowConfirmationDeleteModal(false)

  const deleteCredential = async () => {
    if (credentialDetails) {
      await agent?.w3cCredentials.deleteById(credentialDetails.mainInfo.id)
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
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isFetchingInfo} onRefresh={refreshServiceInfo} />}
        >
          <View style={styles.subContainer}>
            <CredentialDetailsComponent
              credentialDetails={credentialDetails}
              middleInfo={
                <View style={styles.optionsContainer}>
                  <OptionsList options={options} />
                </View>
              }
              isFetchingInfo={isFetchingInfo}
              serviceInfo={serviceInfo}
              failedFetchInfo={failedFetchInfo}
              withLoadingSkeleton={false}
            />
            <Text fontFamily="EuclidCircularA-SemiBold" style={styles.titleIssuerInfo}>
              {t('credentialOffer.issuerInformation')}
            </Text>
            <ServiceMainInfoAndProofOfTrust
              isFetchingInfo={isFetchingInfo}
              serviceInfo={serviceInfo}
              failedFetchInfo={failedFetchInfo}
              withLoadingSkeleton={false}
            />
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
