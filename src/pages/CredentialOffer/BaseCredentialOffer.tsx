import { HeaderBackButton } from '@react-navigation/elements'
import { ParamListBase } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { CredentialDetails, ModalConfirmAction } from '@src/components'
import { ServiceInformation, Text } from '@src/components/common'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { useFetchServiceInfo } from '@src/hooks/useFetchServiceInfo'
import { useVeranaIssuerAccreditation } from '@src/hooks/useVeranaAccreditation'
import { ServiceInfo, UNVERIFIED_SERVICE_STATUS } from '@src/model'
import { CredentialDetailsForDisplay } from '@src/services/agent/display'
import { isVeranaActionBlocked, veranaTrustStatusOf } from '@src/services/verana'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import getStyles from './styles'

type Props = {
  navigation: StackNavigationProp<ParamListBase>
  credentialDetails: CredentialDetailsForDisplay
  credentialRecordId: string
  accept: () => void
  refuse: () => void
  enableMainButtons: boolean
}

const BaseCredentialOffer: React.FC<Props> = ({
  navigation,
  credentialDetails,
  credentialRecordId,
  accept,
  refuse,
  enableMainButtons,
}) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const did = credentialDetails.mainInfo.issuer.id
  const { isFetchingInfo, serviceInfo, failedFetchInfo } = useFetchServiceInfo({ did })
  const { accreditation, isChecking } = useVeranaIssuerAccreditation({ did, credentialRecordId })
  const [showModalRefuseConfirmation, setShowModalRefuseConfirmation] = useState(false)
  const initialServiceInfo = useRef<ServiceInfo>({
    did,
    id: did,
    name: credentialDetails.mainInfo.issuer.name,
    logoUrl: credentialDetails.mainInfo.issuer.logoUrl,
    minimumAgeRequired: 0,
    status: UNVERIFIED_SERVICE_STATUS,
    trustStatus: 'UNVERIFIED',
  })

  const trustBlocked = isVeranaActionBlocked({
    trustStatus: veranaTrustStatusOf(serviceInfo, failedFetchInfo),
    isResolving: isFetchingInfo,
    isCheckingPermission: isChecking,
    permissionGranted: accreditation?.granted,
  })
  const canAccept = enableMainButtons && !trustBlocked

  const displayModalRefuseConfirmation = () => setShowModalRefuseConfirmation(true)
  const hideModalRefuseConfirmation = () => setShowModalRefuseConfirmation(false)

  const onRefuse = () => {
    hideModalRefuseConfirmation()
    refuse()
  }

  useEffect(() => {
    navigation.setOptions({
      headerLeft: (props) =>
        enableMainButtons ? (
          <TouchableOpacity style={styles.headerLeft} onPress={displayModalRefuseConfirmation}>
            <Text fontFamily="EuclidCircularA-Medium" style={styles.headerBtnText}>
              {t('general.refuse')}
            </Text>
          </TouchableOpacity>
        ) : (
          <HeaderBackButton {...props} />
        ),
      headerRight: () =>
        canAccept ? (
          <TouchableOpacity style={styles.headerRight} onPress={accept}>
            <Text fontFamily="EuclidCircularA-Medium" style={styles.headerBtnText}>
              {t('general.accept')}
            </Text>
          </TouchableOpacity>
        ) : null,
    })
  }, [enableMainButtons, canAccept])

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ModalConfirmAction
        visible={showModalRefuseConfirmation}
        title={t('chat.confirmRefuseCredentialOffer')}
        subTitle=""
        confirmText={t('general.confirm')}
        cancelText="No"
        onClose={hideModalRefuseConfirmation}
        onConfirm={onRefuse}
        onCancel={hideModalRefuseConfirmation}
      />
      {credentialDetails && (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.subContainer}>
            <Text style={styles.credentialTitle}>
              {credentialDetails.mainInfo.issuer.name} {t('credentialOffer.offeringYou')}
            </Text>
            <Text fontFamily="EuclidCircularA-Bold" style={[styles.credentialTitle, styles.verifiableCredentialText]}>
              {t('credentialOffer.verifiableCredential')}
            </Text>
            <CredentialDetails
              credentialDetails={credentialDetails}
              isFetchingInfo={isFetchingInfo}
              serviceInfo={serviceInfo}
              failedFetchInfo={failedFetchInfo}
            />
            <View style={styles.containerSectionIssuerInfo}>
              <Text fontFamily="EuclidCircularA-Medium" style={styles.titleIssuerInfo}>
                {t('credentialOffer.issuerInformation')}
              </Text>
              <ServiceInformation
                initialServiceInfo={initialServiceInfo.current}
                isFetchingInfo={isFetchingInfo}
                serviceInfo={serviceInfo}
                failedFetchInfo={failedFetchInfo}
                ask={{
                  kind: 'offer',
                  credential: credentialDetails.mainInfo.schemaName,
                  party: serviceInfo?.name || credentialDetails.mainInfo.issuer.name || did,
                  accreditation,
                  isChecking,
                }}
              />
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

export default BaseCredentialOffer
