import { HeaderBackButton } from '@react-navigation/elements'
import { ParamListBase } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { View, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native'

import getStyles from './styles'

import { CredentialDetails, ModalConfirmAction } from '@2060/components'
import { Text, ServiceInformation } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { CredentialDetailsForDisplay } from '@2060/services/agent/display'
import { ServiceInfo } from '@2060/services/api/trustRegistryService'

type Props = {
  navigation: StackNavigationProp<ParamListBase>
  credentialDetails: CredentialDetailsForDisplay
  accept: () => void
  refuse: () => void
  enableAcceptRejectButtons: boolean
}

const BaseCredentialOffer: React.FC<Props> = ({
  navigation,
  credentialDetails,
  accept,
  refuse,
  enableAcceptRejectButtons,
}) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  const serviceInfo = useRef<ServiceInfo>({
    did: credentialDetails.mainInfo.issuer.id,
    id: credentialDetails.mainInfo.issuer.id,
    name: credentialDetails.mainInfo.issuer.name,
    logoUrl: credentialDetails.mainInfo.issuer.logoUrl,
    minimumAgeRequired: 0,
    status: 'notFound',
  })

  const { t } = useTranslation()
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
        enableAcceptRejectButtons ? (
          <TouchableOpacity style={styles.headerLeft} onPress={displayModalRefuseConfirmation}>
            <Text typography="EuclidCircularA-Medium" style={styles.headerBtnText}>
              {t('general.refuse')}
            </Text>
          </TouchableOpacity>
        ) : (
          <HeaderBackButton {...props} />
        ),
      headerRight: () =>
        enableAcceptRejectButtons ? (
          <TouchableOpacity style={styles.headerRight} onPress={accept}>
            <Text typography="EuclidCircularA-Medium" style={styles.headerBtnText}>
              {t('general.accept')}
            </Text>
          </TouchableOpacity>
        ) : null,
    })
  }, [enableAcceptRejectButtons])

  return (
    <SafeAreaView style={styles.root}>
      <ModalConfirmAction
        visible={showModalRefuseConfirmation}
        title={t('personalChat.confirmRefuseCredentialOffer')}
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
            <Text typography="EuclidCircularA-Regular" style={styles.credentialTitle}>
              {credentialDetails.mainInfo.issuer.name} {t('credentialOffer.offeringYou')}
            </Text>
            <Text typography="EuclidCircularA-Bold" style={[styles.credentialTitle, { marginBottom: 15 }]}>
              {t('credentialOffer.verifiableCredential')}
            </Text>
            <CredentialDetails credentialDetails={credentialDetails} />
            <View style={styles.containerSectionIssuerInfo}>
              <Text typography="EuclidCircularA-Medium" style={styles.titleIssuerInfo}>
                {t('credentialOffer.issuerInformation')}
              </Text>
              <ServiceInformation
                did={credentialDetails.mainInfo.issuer.id}
                initialServiceInfo={serviceInfo.current}
              />
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

export default BaseCredentialOffer
