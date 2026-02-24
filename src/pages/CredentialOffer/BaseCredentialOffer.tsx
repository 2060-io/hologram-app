import { HeaderBackButton } from '@react-navigation/elements'
import { ParamListBase } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { View, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import getStyles from './styles'

import { CredentialDetails, ModalConfirmAction } from '@src/components'
import { Text, ServiceInformation } from '@src/components/common'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { useFetchServiceInfo } from '@src/hooks/useFetchServiceInfo'
import { CredentialDetailsForDisplay } from '@src/services/agent/display'

type Props = {
  navigation: StackNavigationProp<ParamListBase>
  credentialDetails: CredentialDetailsForDisplay
  accept: () => void
  refuse: () => void
  enableMainButtons: boolean
}

const BaseCredentialOffer: React.FC<Props> = ({
  navigation,
  credentialDetails,
  accept,
  refuse,
  enableMainButtons,
}) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const did = credentialDetails.mainInfo.issuer.id
  const { isFetchingInfo, serviceInfo, failedFetchInfo } = useFetchServiceInfo(did)
  const [showModalRefuseConfirmation, setShowModalRefuseConfirmation] = useState(false)

  const displayModalRefuseConfirmation = () => setShowModalRefuseConfirmation(true)
  const hideModalRefuseConfirmation = () => setShowModalRefuseConfirmation(false)

  const onRefuse = () => {
    hideModalRefuseConfirmation()
    refuse()
  }

  useEffect(() => {
    navigation.setOptions({
      headerLeft: props =>
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
        enableMainButtons ? (
          <TouchableOpacity style={styles.headerRight} onPress={accept}>
            <Text fontFamily="EuclidCircularA-Medium" style={styles.headerBtnText}>
              {t('general.accept')}
            </Text>
          </TouchableOpacity>
        ) : null,
    })
  }, [enableMainButtons])

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
            <Text
              fontFamily="EuclidCircularA-Bold"
              style={[styles.credentialTitle, styles.verifiableCredentialText]}
            >
              {t('credentialOffer.verifiableCredential')}
            </Text>
            <CredentialDetails
              credentialDetails={credentialDetails}
              isFetchingInfo={isFetchingInfo}
              serviceInfo={serviceInfo}
              failedFetchInfo={failedFetchInfo}
              withLoadingSkeleton={true}
            />
            <View style={styles.containerSectionIssuerInfo}>
              <Text fontFamily="EuclidCircularA-Medium" style={styles.titleIssuerInfo}>
                {t('credentialOffer.issuerInformation')}
              </Text>
              <ServiceInformation
                isFetchingInfo={isFetchingInfo}
                serviceInfo={serviceInfo}
                failedFetchInfo={failedFetchInfo}
                withLoadingSkeleton={true}
              />
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

export default BaseCredentialOffer
