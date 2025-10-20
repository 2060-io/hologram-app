import { StackScreenProps } from '@react-navigation/stack'
import { TrustResolutionOutcome } from '@verana-labs/verre'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, TouchableOpacity, SafeAreaView, View } from 'react-native'

import getStyles from './styles'

import {
  CredentialDetails as CredentialDetailsComponent,
  ModalBottomHalf,
  ModalConfirmAction,
} from '@2060/components'
import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { SvgIcon, Text, ServiceInformation } from '@2060/components/common'
import { useCredentialById, useMobileAgent } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { ServiceInfo } from '@2060/model'
import { getCredentialDetailsForDisplay } from '@2060/services/agent/display'
import { trimText } from '@2060/utils'

interface Props extends StackScreenProps<NavigationStackParams, 'CredentialDetails'> {}
const CredentialDetails = ({ route, navigation }: Props) => {
  const { credentialRecordId } = route.params
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const [showConfirmationDeleteModal, setShowConfirmationDeleteModal] = useState(false)
  const [showContextualMenu, setShowContextualMenu] = useState(false)
  const { agent } = useMobileAgent()
  const credentialRecord = useCredentialById(credentialRecordId)
  const credentialDetails = credentialRecord ? getCredentialDetailsForDisplay(credentialRecord) : undefined
  const did = credentialRecord?.credential.issuerId ?? ''
  const serviceInfo = useRef<ServiceInfo>({
    did,
    id: did,
    name: credentialDetails?.mainInfo.issuer.name ?? trimText(did),
    logoUrl: credentialDetails?.mainInfo.issuer.logoUrl,
    minimumAgeRequired: 0,
    status: TrustResolutionOutcome.INVALID,
  })

  const handleShowContextMenu = () => setShowContextualMenu(prevState => !prevState)

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleShowContextMenu} style={styles.headerRight}>
          <SvgIcon name="menuOutline" fill={theme.colors.primaryText} />
        </TouchableOpacity>
      ),
    })
  }, [theme.colors])

  const hideConfirmationDeleteModal = () => setShowConfirmationDeleteModal(false)

  const deleteCredential = async () => {
    if (credentialDetails) {
      await agent?.w3cCredentials.removeCredentialRecord(credentialDetails.mainInfo.id)
    }
    hideConfirmationDeleteModal()
    navigation.goBack()
  }

  const goToPresentCredential = () => {
    handleShowContextMenu()
    navigation.navigate('PresentCredential', { credentialRecordId })
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
              <ServiceInformation did={did} initialServiceInfo={serviceInfo.current} />
            </>
          )}
          <View style={styles.containerCardBtnDelete}>
            <TouchableOpacity
              style={styles.containerBtnDelete}
              onPress={() => setShowConfirmationDeleteModal(true)}
            >
              <SvgIcon name="trash" width={20} height={20} fill={theme.colors.primaryText} />
              <Text style={styles.optionText}>{t('credential.delete')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <ModalBottomHalf visible={showContextualMenu} onClose={handleShowContextMenu}>
        <TouchableOpacity style={styles.containerOptionCard} onPress={goToPresentCredential}>
          <Text style={styles.actionText}>{t('credential.present')}</Text>
        </TouchableOpacity>
      </ModalBottomHalf>
    </SafeAreaView>
  )
}

export default CredentialDetails
