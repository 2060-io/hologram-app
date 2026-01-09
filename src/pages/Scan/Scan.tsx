/* eslint-disable no-underscore-dangle */
import { OutOfBandInvitation, Buffer } from '@credo-ts/core'
import { useIsFocused } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import { parseUrl } from 'query-string'
import React, { useState, useEffect, useTransition } from 'react'
import { useTranslation } from 'react-i18next'
import {
  View,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  TouchableOpacity,
} from 'react-native'

import getStyles from './styles'

import { CodeScanner } from '@2060/components'
import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { TextInput, Text, MainButton, ModalLoading } from '@2060/components/common'
import { useAppState } from '@2060/hooks'
import { useMobileAgent } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { DidcommInvitationType, getOutOfBandRecordById, processInvitation } from '@2060/services/agent/oob'
import { isOpenIdCredentialOffer, isOpenIdPresentationRequest } from '@2060/services/agent/parsers'
import { log, logError } from '@2060/utils'
import { toast } from '@2060/utils/toast'

interface Props extends StackScreenProps<NavigationStackParams, 'Scan'> {}

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
  const [processing, startProcessTransition] = useTransition()

  useEffect(() => {
    setIsActiveCamera(isFocused && isAppActive)
  }, [isFocused, isAppActive])

  const behavior = Platform.OS === 'ios' ? 'padding' : 'height'

  const isTabSelected = (tab: string) => tab === tabType

  const processDidcommInvitation = async (invitation: OutOfBandInvitation) => {
    if (!agent) return
    startProcessTransition(async () => {
      try {
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
      }
    })
  }

  const onCodeScanned = async (url: string) => {
    if (!agent) return
    try {
      setIsActiveCamera(false)
      if (isOpenIdCredentialOffer(url)) {
        navigation.navigate('OpenIdCredentialOffer', { url })
      } else if (isOpenIdPresentationRequest(url)) {
        navigation.navigate('OpenIdPresentationRequest', { url })
      } else {
        const parsedUrl = parseUrl(url)
        const shortUrl =
          ((parsedUrl.query.oobUrl as string | undefined) ?? (parsedUrl.query._url as string | undefined))
            ? Buffer.from(parsedUrl.query._url as string, 'base64').toString('ascii')
            : undefined
        const invitation = await agent.oob.parseInvitation(shortUrl ?? url)
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
        <Text style={[styles.tabText, isTabSelected('scanner') && styles.selectedTabText]}>
          {t('scan.useCamera')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setTabType('link')}
        style={[styles.containerTab, isTabSelected('link') && styles.containerSelectedTab]}
      >
        <Text style={[styles.tabText, isTabSelected('link') && styles.selectedTabText]}>
          {t('scan.useLink')}
        </Text>
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
              onChangeText={text => setScannedCode(text)}
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
    <View style={styles.container}>
      <ModalLoading visible={processing} />
      {renderTabs()}
      {tabType === 'link' && renderLinkInput()}
      {tabType === 'scanner' && renderScanner()}
    </View>
  )
}

export default Scan
