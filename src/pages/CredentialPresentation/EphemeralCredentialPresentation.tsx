import { ProofEventTypes, ProofState, ProofStateChangedEvent } from '@credo-ts/core'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity } from 'react-native'
import { filter, Subscription } from 'rxjs'

import BaseCredentialPresentation from './BaseCredentialPresentation'
import getStyles from './styles'

import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { Text } from '@2060/components/common'
import { useMobileAgent } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { getCredentialRevealedAttributes } from '@2060/services/agent/proofs'

interface Props extends StackScreenProps<NavigationStackParams, 'EphemeralCredentialPresentation'> {}

const EphemeralCredentialPresentation = ({ navigation, route }: Props) => {
  const { proofState: initialProofState, attributes: initialAttributes, proofRecordId } = route.params
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { agent } = useMobileAgent()
  const [proofState, setProofState] = useState(initialProofState)
  const [attributes, setAttributes] = useState(initialAttributes)

  useEffect(() => {
    let observableOfProofStateChangedEvent: Subscription | undefined
    const subscribeToProofStateChangedEvent = () => {
      const observableOfProofStateChanged = agent?.events
        .observable<ProofStateChangedEvent>(ProofEventTypes.ProofStateChanged)
        .pipe(filter(event => event.payload.proofRecord.id === proofRecordId))
      observableOfProofStateChangedEvent = observableOfProofStateChanged?.subscribe(async event => {
        const { proofRecord } = event.payload
        setProofState(proofRecord.state)
      })
    }
    subscribeToProofStateChangedEvent()
    return () => {
      observableOfProofStateChangedEvent?.unsubscribe()
    }
  }, [agent])

  useEffect(() => {
    const handleProofRecordStateChanged = async () => {
      if (proofState === ProofState.PresentationReceived && agent) {
        const revealedAttributes = await getCredentialRevealedAttributes({ agent, proofRecordId })
        setAttributes(revealedAttributes)
      }
    }
    handleProofRecordStateChanged()
  }, [agent, proofState])

  useEffect(() => {
    if (proofState !== ProofState.ProposalReceived) {
      navigation.setOptions({
        headerLeft: () => null,
        headerRight: () => (
          <TouchableOpacity style={styles.headerRight} onPress={() => navigation.goBack()}>
            <Text fontFamily="EuclidCircularA-Medium" style={styles.headerBtnText}>
              {t('general.done')}
            </Text>
          </TouchableOpacity>
        ),
      })
    }
  }, [proofState])

  return (
    <BaseCredentialPresentation
      {...route.params}
      attributes={attributes}
      proofState={proofState}
      navigation={navigation}
    />
  )
}

export default EphemeralCredentialPresentation
