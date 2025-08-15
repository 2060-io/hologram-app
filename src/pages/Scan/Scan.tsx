/* eslint-disable no-underscore-dangle */
import { OutOfBandInvitation } from '@credo-ts/core'
import { Buffer } from '@credo-ts/core/build/utils/buffer'
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import { useIsFocused, ParamListBase } from '@react-navigation/native'
import { parseUrl } from 'query-string'
import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  View,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  TouchableOpacity,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { isOpenIdCredentialOffer, isOpenIdPresentationRequest } from '../../services/agent/parsers'

import getStyles from './styles'

import { CodeScanner } from '@2060/components'
import { TextInput, Text, MainButton, ModalLoading } from '@2060/components/common'
import { useAppState } from '@2060/hooks'
import { useMobileAgent } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { DidcommInvitationType, processInvitation } from '@2060/services/agent/oob'
import { log, logError } from '@2060/utils'
import { toast } from '@2060/utils/toast'

interface Props extends BottomTabScreenProps<ParamListBase, 'Scan', 'tab_navigator_home'> {}

const Scan = ({ navigation }: Props) => {
  const [scannedCode, setScannedCode] = useState('')
  const [tabType, setTabType] = useState<'link' | 'scanner'>('scanner')
  const theme = useTheme()
  const styles = getStyles(theme)
  const [processing, setProcessing] = useState<boolean>(false)

  // check if camera page is active
  const isFocused = useIsFocused()
  const { isAppActive } = useAppState()
  const { agent } = useMobileAgent()
  const { t } = useTranslation()

  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    setIsActive(isFocused && isAppActive)
  }, [isFocused, isAppActive])

  const behavior = Platform.OS === 'ios' ? 'padding' : 'height'

  const isTabSelected = (tab: string) => tab === tabType

  const processDidcommInvitation = async (invitation: OutOfBandInvitation) => {
    if (!agent) return
    setProcessing(true)
    let processInvitationResult
    try {
      processInvitationResult = await processInvitation(agent, invitation)

      log(`processInvitationResult: ${JSON.stringify(processInvitationResult)}`)

      const { success, existingConnectionId, invitationType, recordId } = processInvitationResult

      if (!success || !recordId) return

      if (invitationType === DidcommInvitationType.ConnectionRequest) {
        const outOfBandRecord = await agent.oob.getById(recordId)
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
      }
    } finally {
      setProcessing(false)
      if (!processInvitationResult?.success) throw new Error(processInvitationResult?.error)
    }
  }

  const processCode = async (codeUrl: string) => {
    if (!agent) throw new Error('Agent not defined')
    try {
      setIsActive(false)
      if (isOpenIdCredentialOffer(codeUrl)) {
        navigation.navigate('OpenIdCredentialOffer', { url: codeUrl })
      } else if (isOpenIdPresentationRequest(codeUrl)) {
        navigation.navigate('OpenIdPresentationRequest', { url: codeUrl })
      } else {
        // Try to parse a didcomm invitation

        // Pre-parse it to look for _url or oobUrl deep link parameter
        const parsedUrl = parseUrl(codeUrl)
        const shortUrl =
          ((parsedUrl.query.oobUrl as string | undefined) ?? (parsedUrl.query._url as string | undefined))
            ? Buffer.from(parsedUrl.query._url as string, 'base64').toString('ascii')
            : undefined

        const invitation = await agent.oob.parseInvitation(shortUrl ?? codeUrl)

        if (!invitation) throw new Error('Invitation undefined')
        await processDidcommInvitation(invitation)
      }
      setScannedCode('')
    } catch (error) {
      setIsActive(true)
      toast({
        type: 'error',
        message: t('scan.errorProcessingCodeOrLink', { message: (error as Error).message }),
        duration: 5000,
      })
      logError('Error processing code', error)
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
        <Text typography="EuclidCircularA-Regular" style={styles.textDescriptionScanner}>
          {t('scan.textDescriptionScanner')}
        </Text>
      </View>
      <CodeScanner isActive={isActive} onBarcodeScanned={processCode} />
    </View>
  )

  const renderLinkInput = () => (
    <KeyboardAvoidingView behavior={behavior} style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.containerContent}>
          <Text typography="EuclidCircularA-Regular" style={styles.textDescriptionLink}>
            {t('scan.textDescriptionLink')}
          </Text>
          <View style={styles.containerInput}>
            <TextInput
              value={scannedCode}
              multiline={true}
              numberOfLines={6}
              underlineColorAndroid="transparent"
              onFocus={() => navigation.setOptions({ tabBarHideOnKeyboard: true })}
              onBlur={() => navigation.setOptions({ tabBarHideOnKeyboard: false })}
              onChangeText={text => setScannedCode(text)}
              style={styles.input}
            />
          </View>
          <MainButton
            text={t('general.open')}
            onPress={() => processCode(scannedCode)}
            activeOpacity={0.5}
            style={styles.containerBtnOpen}
          />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  )

  useEffect(() => {
    if (!isFocused) toast(null)
  }, [isFocused])

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <ModalLoading visible={processing} />
        <View style={{ flex: 1 }}>
          {renderTabs()}
          {tabType === 'link' && renderLinkInput()}
          {tabType === 'scanner' && renderScanner()}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default Scan
