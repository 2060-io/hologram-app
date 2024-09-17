import { StackScreenProps } from '@react-navigation/stack'
import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, TouchableOpacity, SafeAreaView, View } from 'react-native'

import getStyles from './styles'

import { CredentialDetails as CredentialDetailsComponent, ModalConfirmAction } from '@2060/components'
import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { SvgIcon, Text, ServiceInformation } from '@2060/components/common'
import { useCredentialById, useMobileAgent } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { getCredentialDetailsForDisplay } from '@2060/services/agent/display'
import { ServiceInfo } from '@2060/services/api/trustRegistryService'
import { trimText } from '@2060/utils'

interface Props extends StackScreenProps<NavigationStackParams, 'CredentialDetails'> {}
const CredentialDetails = ({ route, navigation }: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const [showConfirmationDeleteModal, setShowConfirmationDeleteModal] = useState(false)

  const { agent } = useMobileAgent()
  const credentialRecord = useCredentialById(route.params.credentialRecordId)
  const credentialDetails = credentialRecord ? getCredentialDetailsForDisplay(credentialRecord) : undefined
  const did = credentialRecord?.credential.issuerId ?? ''
  const serviceInfo = useRef<ServiceInfo>({
    did,
    id: did,
    name: credentialDetails?.mainInfo.issuer.name ?? trimText(did),
    logoUrl: credentialDetails?.mainInfo.issuer.logoUrl,
    minimumAgeRequired: 0,
    status: 'notFound',
  })

  const hideConfirmationDeleteModal = () => setShowConfirmationDeleteModal(false)

  const deleteCredential = async () => {
    if (credentialDetails) {
      await agent?.w3cCredentials.removeCredentialRecord(credentialDetails.mainInfo.id)
    }

    hideConfirmationDeleteModal()
    navigation.goBack()
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.subContainer}>
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
          {credentialDetails && (
            <>
              <CredentialDetailsComponent credentialDetails={credentialDetails} />
              <Text typography="EuclidCircularA-SemiBold" style={styles.titleIssuerInfo}>
                {t('credentialOffer.issuerInformation')}
              </Text>
              {serviceInfo && <ServiceInformation did={did} serviceInfoRef={serviceInfo} />}
            </>
          )}
          <View style={styles.containerCardBtnDelete}>
            <TouchableOpacity
              style={styles.containerBtnDelete}
              onPress={() => setShowConfirmationDeleteModal(true)}
            >
              <SvgIcon name="trash" width={20} height={20} fill={theme.colors.primaryText} />
              <Text style={styles.optionText} typography="EuclidCircularA-Regular">
                {t('credential.delete')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default CredentialDetails
