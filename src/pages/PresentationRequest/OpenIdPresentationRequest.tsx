import { StackActions } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useCallback, useLayoutEffect, useMemo, useState, useRef } from 'react'
import { SafeAreaView } from 'react-native'

import BasePresentationRequest from './BasePresentationRequest'
import getStyles from './styles'

import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { ModalLoading } from '@2060/components/common'
import { useMobileAgent } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { formatW3cPresentationSubmission } from '@2060/services/agent/formatPresentation'
import { getCredentialsForProofRequest, shareProof } from '@2060/services/agent/parsers'
import { logError } from '@2060/utils'
import { toast } from '@2060/utils/toast'

export interface Props extends StackScreenProps<NavigationStackParams, 'OpenIdPresentationRequest'> {}

const OpenIdPresentationRequest: React.FC<Props> = ({ route, navigation }) => {
  const { agent } = useMobileAgent()
  const theme = useTheme()
  const styles = getStyles(theme)
  const url = route.params.url
  const [isAcceptingRequest, setIsAcceptingRequest] = useState(false)
  const [isProcessingCode, setIsProcessingCode] = useState(false)
  const submissionEntryIndexes = useRef<number[]>([])

  const [credentialsForRequest, setCredentialsForRequest] =
    useState<Awaited<ReturnType<typeof getCredentialsForProofRequest>>>()

  const submission = useMemo(
    () =>
      credentialsForRequest?.selectResults
        ? formatW3cPresentationSubmission(credentialsForRequest.selectResults, {
            id: credentialsForRequest.verifierHostName ?? '',
            logoUrl: '',
            name: credentialsForRequest.verifierHostName ?? '',
            status: 'verified',
          })
        : undefined,
    [credentialsForRequest],
  )

  const onSelectCredential = (newSubmissionEntryIndexes: number[]) => {
    submissionEntryIndexes.current = newSubmissionEntryIndexes
  }

  const onRefuse = async () => {
    if (navigation.canGoBack()) navigation.goBack()
    else navigation.dispatch(StackActions.replace('Home'))
  }

  const onAccept = useCallback(async () => {
    setIsAcceptingRequest(true)
    try {
      if (!agent) throw new Error('Agent not initialized')
      if (!credentialsForRequest?.selectResults) throw Error('No credentialsForRequest')
      await shareProof({
        selectResults: credentialsForRequest.selectResults,
        verifiedAuthorizationRequest: credentialsForRequest.verifiedAuthorizationRequest,
        agent,
        submissionEntryIndexes: submissionEntryIndexes.current,
      })
      if (navigation.canGoBack()) navigation.goBack()
      else navigation.dispatch(StackActions.replace('Home'))
    } catch (error) {
      toast({ type: 'error', message: `Failed to accept offer: ${error}` })
    } finally {
      setIsAcceptingRequest(false)
    }
  }, [credentialsForRequest, submissionEntryIndexes.current])

  const processCode = async () => {
    if (!agent) throw new Error('Agent not initialized')
    setIsProcessingCode(true)
    try {
      const req = await getCredentialsForProofRequest({
        agent,
        data: url,
      })
      setCredentialsForRequest(req)
    } catch (error) {
      logError(JSON.stringify(error))
      toast({ type: 'error', message: `Failed to process proof request: ${error}` })
    } finally {
      setIsProcessingCode(false)
    }
  }

  useLayoutEffect(() => {
    processCode()
  }, [])

  return (
    <SafeAreaView style={styles.root}>
      <ModalLoading visible={isProcessingCode} />
      {submission && (
        <BasePresentationRequest
          navigation={navigation}
          submission={submission}
          isFromDidComm={false}
          onSelectOpenIdCredential={onSelectCredential}
          accept={onAccept}
          refuse={onRefuse}
          isAccepting={isAcceptingRequest}
        />
      )}
    </SafeAreaView>
  )
}

export default OpenIdPresentationRequest
