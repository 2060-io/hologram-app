import { HeaderBackButton } from '@react-navigation/elements'
import { ParamListBase } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { View, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import getStyles from './styles'

import { CredentialDetails, ModalConfirmAction } from '@2060/components'
import { Text, ServiceInformation } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { CredentialDetailsForDisplay } from '@2060/services/agent/display'

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
            <Text style={styles.credentialTitle}>
              {credentialDetails.mainInfo.issuer.name} {t('credentialOffer.offeringYou')}
            </Text>
            <Text
              fontFamily="EuclidCircularA-Bold"
              style={[styles.credentialTitle, styles.verifiableCredentialText]}
            >
              {t('credentialOffer.verifiableCredential')}
            </Text>
            <CredentialDetails credentialDetails={credentialDetails} />
            <View style={styles.containerSectionIssuerInfo}>
              <Text fontFamily="EuclidCircularA-Medium" style={styles.titleIssuerInfo}>
                {t('credentialOffer.issuerInformation')}
              </Text>
              <ServiceInformation did={credentialDetails.mainInfo.issuer.id} />
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

export default BaseCredentialOffer
