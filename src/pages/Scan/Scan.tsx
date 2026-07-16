/* eslint-disable no-underscore-dangle */
import { TypedArrayEncoder } from '@credo-ts/core'
import { DidCommOutOfBandInvitation } from '@credo-ts/didcomm'
import { useIsFocused } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import { CodeScanner } from '@src/components'
import { MainButton, ModalLoading, Text, TextInput } from '@src/components/common'
import { NavigationStackParams } from '@src/components/Navigation/NavigationProps'
import { useAppState } from '@src/hooks'
import { useMobileAgent } from '@src/hooks/agent'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import {
  DidcommInvitationType,
  getOutOfBandRecordById,
  processImplicitInvitation,
  processInvitation,
} from '@src/services/agent/oob'
import { log, logError } from '@src/utils'
import { toast } from '@src/utils/toast'
import queryString from 'query-string'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import getStyles from './styles'

type Props = StackScreenProps<NavigationStackParams, 'Scan'>

const Scan = ({ navigation }: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const isFocused = useIsFocused()
  const { isAppActive } = useAppState()
  const { agent } = useMobileAgent()
  const [scannedCode, setScannedCode] = useState('')
  const [tabType, setTabType] = useState<'link' | 'scanner'>('scanner')
  const [isActiveCamera, setIsActiveCamera] = useState(false)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    setIsActiveCamera(isFocused && isAppActive)
  }, [isFocused, isAppActive])

  const behavior = Platform.OS === 'ios' ? 'padding' : 'height'

  const isTabSelected = (tab: string) => tab === tabType

  const processDidcommInvitation = async (invitation: DidCommOutOfBandInvitation) => {
    if (!agent) return
    try {
      setProcessing(true)
      const processInvitationResult = await processInvitation(agent, invitation)
      log('processInvitationResult:', processInvitationResult)
      if (!processInvitationResult.success) throw new Error(processInvitationResult.error)
      const { existingConnectionId, invitationType, recordId } = processInvitationResult
      if (invitationType === DidcommInvitationType.ConnectionRequest) {
        const outOfBandRecord = await getOutOfBandRecordById(agent, recordId)
        navigation.navigate('ConnectionInvitation', {
          outOfBandRecord,
          existingConnectionId,
        })
      } else if (invitationType === DidcommInvitationType.CredentialOffer) {
        navigation.navigate('DidcommCredentialOffer', {
          credentialRecordId: recordId,
          did: invitation.invitationDids[0],
        })
      } else if (invitationType === DidcommInvitationType.PresentationRequest) {
        navigation.navigate('DidcommPresentationRequest', {
          proofRecordId: recordId,
          did: invitation.invitationDids[0],
        })
      } else {
        navigation.navigate('EphemeralCredentialPresentation', { proofRecordId: recordId })
      }
    } catch (error) {
      setIsActiveCamera(true)
      toast({ type: 'error', message: t('invitation.errorProcessingInvitation'), duration: 5000 })
      logError(`Error processing Didcomm Invitation: ${error}`)
    } finally {
      setProcessing(false)
    }
  }

  const processImplicitDidInvitation = async (did: string) => {
    if (!agent) return
    try {
      setProcessing(true)
      const result = await processImplicitInvitation(agent, did)
      log('processImplicitInvitationResult:', result)
      if (!result.success) throw new Error(result.error)
      const outOfBandRecord = await getOutOfBandRecordById(agent, result.recordId)
      navigation.navigate('ConnectionInvitation', {
        outOfBandRecord,
        existingConnectionId: result.existingConnectionId,
      })
    } catch (error) {
      setIsActiveCamera(true)
      toast({ type: 'error', message: t('invitation.errorProcessingInvitation'), duration: 5000 })
      logError(`Error processing Didcomm Invitation: ${error}`)
    } finally {
      setProcessing(false)
    }
  }

  const onCodeScanned = async (rawUrl: string) => {
    if (!agent) return
    try {
      setIsActiveCamera(false)

      const url = rawUrl.trim()
      if (url.startsWith('did:')) {
        await processImplicitDidInvitation(url)
      } else {
        const parsedUrl = queryString.parseUrl(url)
        const oobUrl = parsedUrl.query.oobUrl as string | undefined
        const encodedUrl = parsedUrl.query._url as string | undefined
        const shortUrl = encodedUrl
          ? TypedArrayEncoder.toUtf8String(TypedArrayEncoder.fromBase64Url(encodedUrl))
          : oobUrl
        const invitation = await agent.didcomm.oob.parseInvitation(shortUrl ?? url)
        await processDidcommInvitation(invitation)
      }

      setScannedCode('')
    } catch (error) {
      setIsActiveCamera(true)
      toast({ type: 'error', message: t('invitation.errorProcessingInvitation'), duration: 5000 })
      logError('Error processing code: ', error)
    }
  }

  const renderTabs = () => (
    <View style={styles.containerTabs}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setTabType('scanner')}
        style={[styles.containerTab, isTabSelected('scanner') && styles.containerSelectedTab]}
      >
        <Text style={[styles.tabText, isTabSelected('scanner') && styles.selectedTabText]}>{t('scan.useCamera')}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setTabType('link')}
        style={[styles.containerTab, isTabSelected('link') && styles.containerSelectedTab]}
      >
        <Text style={[styles.tabText, isTabSelected('link') && styles.selectedTabText]}>{t('scan.useLink')}</Text>
      </TouchableOpacity>
    </View>
  )

  const renderScanner = () => (
    <View style={styles.containerCodeScanner}>
      <View style={styles.containerDescriptionScanner}>
        <Text style={styles.textDescriptionScanner}>{t('scan.textDescriptionScanner')}</Text>
      </View>
      <CodeScanner isActive={isActiveCamera} onCodeScanned={onCodeScanned} />
    </View>
  )

  const renderLinkInput = () => (
    <KeyboardAvoidingView behavior={behavior} style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.containerContent}>
          <Text style={styles.textDescriptionLink}>{t('scan.textDescriptionLink')}</Text>
          <View style={styles.containerInput}>
            <TextInput
              value={scannedCode}
              multiline={true}
              numberOfLines={6}
              underlineColorAndroid="transparent"
              onChangeText={(text) => setScannedCode(text)}
              style={styles.input}
            />
          </View>
          <MainButton
            text={t('general.open')}
            onPress={() => onCodeScanned(scannedCode)}
            activeOpacity={0.5}
            style={styles.containerBtnOpen}
          />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  )

  return (
    <>
      <ModalLoading visible={processing} />
      <View style={styles.container}>
        {renderTabs()}
        {tabType === 'link' && renderLinkInput()}
        {tabType === 'scanner' && renderScanner()}
      </View>
    </>
  )
}

export default Scan
