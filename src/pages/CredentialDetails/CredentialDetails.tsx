import { StackScreenProps } from '@react-navigation/stack'
import { CredentialDetails as CredentialDetailsComponent, ModalConfirmAction } from '@src/components'
import { OptionsList, ServiceInformation, Text } from '@src/components/common'
import { Option } from '@src/components/common/OptionsList'
import { NavigationStackParams } from '@src/components/Navigation/NavigationProps'
import { useCredentials, useMobileAgent } from '@src/hooks/agent'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { useFetchServiceInfo } from '@src/hooks/useFetchServiceInfo'
import { useScrollSwipeDown } from '@src/hooks/useScrollSwipeDown'
import { ServiceInfo, UNVERIFIED_SERVICE_STATUS } from '@src/model'
import { getCredentialDetailsForDisplay } from '@src/services/agent/display'
import { trimText } from '@src/utils'
import { screenHeight } from '@src/utils/responsiveUtils'
import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import getStyles from './styles'

type Props = StackScreenProps<NavigationStackParams, 'CredentialDetails'>
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
  const { isFetchingInfo, serviceInfo, failedFetchInfo, getServiceInfo } = useFetchServiceInfo({ did })
  const { handleScrollBeginDrag, handleScrollEndDrag } = useScrollSwipeDown({
    disabledSwipeDown: isFetchingInfo,
    onSwipeDown: getServiceInfo,
  })
  const initialServiceInfo = useRef<ServiceInfo>({
    did,
    id: did,
    name: credentialDetails?.mainInfo.issuer.name ?? trimText(did),
    logoUrl: credentialDetails?.mainInfo.issuer.logoUrl,
    minimumAgeRequired: 0,
    status: UNVERIFIED_SERVICE_STATUS,
    trustStatus: 'UNVERIFIED',
    claimsVerified: false,
  })

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
          contentContainerStyle={{ minHeight: screenHeight + 1 }}
          onScrollBeginDrag={handleScrollBeginDrag}
          onScrollEndDrag={handleScrollEndDrag}
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
            />
            <Text fontFamily="EuclidCircularA-SemiBold" style={styles.titleIssuerInfo}>
              {t('credentialOffer.issuerInformation')}
            </Text>
            <ServiceInformation
              initialServiceInfo={initialServiceInfo.current}
              isFetchingInfo={isFetchingInfo}
              serviceInfo={serviceInfo}
              failedFetchInfo={failedFetchInfo}
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
