import { HeaderBackButton } from '@react-navigation/elements'
import { ParamListBase } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { CredentialDetails, ModalConfirmAction } from '@src/components'
import { AccreditationBox, ServiceInformation, Text } from '@src/components/common'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { useFetchServiceInfo } from '@src/hooks/useFetchServiceInfo'
import { ServiceInfo, ServiceStatus } from '@src/model'
import { CredentialDetailsForDisplay } from '@src/services/agent/display'
import type { Accreditation } from '@src/services/verana/accreditation'
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import getStyles from './styles'

type Props = {
  navigation: StackNavigationProp<ParamListBase>
  credentialDetails: CredentialDetailsForDisplay
  accept: () => void
  refuse: () => void
  enableMainButtons: boolean
  accreditation?: Accreditation
  isCheckingAccreditation: boolean
  onRetryAccreditation: () => void
}

const BaseCredentialOffer: React.FC<Props> = ({
  navigation,
  credentialDetails,
  accept,
  refuse,
  enableMainButtons,
  accreditation,
  isCheckingAccreditation,
  onRetryAccreditation,
}) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const did = credentialDetails.mainInfo.issuer.id
  const { isFetchingInfo, serviceInfo, failedFetchInfo, getServiceInfo } = useFetchServiceInfo({
    did,
    alwaysFetch: true,
  })
  const [showModalRefuseConfirmation, setShowModalRefuseConfirmation] = useState(false)
  const [showModalUnsafeAccept, setShowModalUnsafeAccept] = useState(false)
  const trustStatus = isFetchingInfo
    ? ServiceStatus.Resolving
    : failedFetchInfo
      ? ServiceStatus.Unverified
      : (serviceInfo?.status ?? ServiceStatus.Resolving)
  const canAccept =
    trustStatus !== ServiceStatus.Resolving &&
    !isCheckingAccreditation &&
    accreditation !== undefined &&
    accreditation.status !== 'unverified'
  const isSafeToAccept = trustStatus === ServiceStatus.Trusted && accreditation?.status === 'authorized'
  const displayIssuerName =
    serviceInfo?.status === ServiceStatus.Trusted && serviceInfo.name
      ? serviceInfo.name
      : credentialDetails.mainInfo.issuer.name
  const { name: issuerName, logoUrl: issuerLogoUrl } = credentialDetails.mainInfo.issuer
  const initialServiceInfo = useMemo<ServiceInfo>(
    () => ({
      did,
      id: did,
      name: issuerName,
      logoUrl: issuerLogoUrl,
      minimumAgeRequired: 0,
      status: ServiceStatus.Resolving,
    }),
    [did, issuerName, issuerLogoUrl]
  )

  const displayModalRefuseConfirmation = () => setShowModalRefuseConfirmation(true)
  const hideModalRefuseConfirmation = () => setShowModalRefuseConfirmation(false)

  const onRefuse = () => {
    hideModalRefuseConfirmation()
    refuse()
  }

  const onUnsafeAccept = () => {
    setShowModalUnsafeAccept(false)
    accept()
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
        enableMainButtons && canAccept ? (
          <TouchableOpacity
            style={styles.headerRight}
            onPress={isSafeToAccept ? accept : () => setShowModalUnsafeAccept(true)}
            testID={isSafeToAccept ? 'offer-accept' : 'offer-accept-unsafe'}
          >
            <Text
              fontFamily="EuclidCircularA-Medium"
              style={[styles.headerBtnText, !isSafeToAccept && styles.unsafeBtnText]}
            >
              {t('general.accept')}
            </Text>
          </TouchableOpacity>
        ) : null,
    })
  }, [enableMainButtons, canAccept, isSafeToAccept])

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
      <ModalConfirmAction
        visible={showModalUnsafeAccept}
        title={t('accreditation.confirmUnsafeAccept')}
        subTitle=""
        confirmText={t('accreditation.acceptAnyway')}
        cancelText={t('general.cancel')}
        onClose={() => setShowModalUnsafeAccept(false)}
        onConfirm={onUnsafeAccept}
        onCancel={() => setShowModalUnsafeAccept(false)}
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
            <AccreditationBox
              party="ISSUER"
              serviceName={displayIssuerName}
              accreditation={accreditation}
              isChecking={isCheckingAccreditation}
              onRetry={onRetryAccreditation}
            />
            <View style={styles.containerSectionIssuerInfo}>
              <Text fontFamily="EuclidCircularA-Medium" style={styles.titleIssuerInfo}>
                {t('credentialOffer.issuerInformation')}
              </Text>
              <ServiceInformation
                initialServiceInfo={initialServiceInfo}
                isFetchingInfo={isFetchingInfo}
                serviceInfo={serviceInfo}
                failedFetchInfo={failedFetchInfo}
                onRetry={getServiceInfo}
              />
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

export default BaseCredentialOffer
