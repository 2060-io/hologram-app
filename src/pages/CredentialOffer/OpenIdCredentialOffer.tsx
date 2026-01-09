import { CredoError, getKeyFromVerificationMethod, getJwkFromKey } from '@credo-ts/core'
import { OpenId4VciCredentialBindingResolver, OpenId4VciResolvedCredentialOffer } from '@credo-ts/openid4vc'
import { StackActions } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect, useState, useTransition } from 'react'

import BaseCredentialOffer from './BaseCredentialOffer'

import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { ModalLoading } from '@2060/components/common'
import { useMobileAgent } from '@2060/hooks/agent'
import { getOfferedCredentialDetailsForDisplay } from '@2060/services/agent/display'
import {
  createDidKidVerificationMethod,
  receiveCredentialFromOpenId4VciOffer,
} from '@2060/services/agent/parsers'
import { logError } from '@2060/utils'
import { toast } from '@2060/utils/toast'

//import { jwtAcademicAward } from '@2060/services/agent/jwt';

interface Props extends StackScreenProps<NavigationStackParams, 'OpenIdCredentialOffer'> {}

const OpenIdCredentialOffer: React.FC<Props> = ({ route, navigation }) => {
  const { agent } = useMobileAgent()
  const { url } = route.params
  const [isAcceptingOffer, startAcceptOfferTransition] = useTransition()
  const [isProcessingCode, startProcessCodeTransition] = useTransition()
  const [credentialRecord, setCredentialRecord] = useState<OpenId4VciResolvedCredentialOffer>()
  const credential = credentialRecord ? getOfferedCredentialDetailsForDisplay(credentialRecord) : undefined

  useEffect(() => {
    processCode()
  }, [])

  const processCode = async () => {
    if (!agent) return
    startProcessCodeTransition(async () => {
      try {
        // FIXME: I'm not sure if we should receive directly or resolve
        const record = await receiveCredentialFromOpenId4VciOffer({
          agent,
          data: url,
        })
        /*
      const record = new W3cCredentialRecord({
        //credential: W3cJwtVerifiableCredential.fromSerializedJwt(jwtJFFOpenBadge),
        credential: W3cJwtVerifiableCredential.fromSerializedJwt(jwtAcademicAward),
        tags: {
          expandedTypes: [],
        },
      });
      */
        if (!record) throw new Error('Cannot parse offer')
        setCredentialRecord(record)
      } catch (error) {
        goBack()
        toast({ type: 'error', message: `Failed to process credential offer: ${error}` })
        logError(`Failed to process credential offer: ${error}`)
      }
    })
  }

  const goBack = () => {
    if (navigation.canGoBack()) navigation.goBack()
    else navigation.dispatch(StackActions.replace('Home'))
  }

  const accept = async () => {
    startAcceptOfferTransition(async () => {
      try {
        if (!agent) throw new Error('Agent not initialized')
        if (!credentialRecord) throw new Error('No credentialrecord')

        // TODO: This should be unique (I think) per agent, not created for every offer
        const tenant = await createDidKidVerificationMethod(agent)

        const credentialBindingResolver: OpenId4VciCredentialBindingResolver = ({
          supportsJwk,
          supportedDidMethods,
        }) => {
          // prefer did:key
          if (supportedDidMethods?.includes('did:key')) {
            return {
              method: 'did',
              didUrl: tenant.verificationMethod.id,
            }
          }

          // otherwise fall back to JWK
          if (supportsJwk) {
            return {
              method: 'jwk',
              jwk: getJwkFromKey(getKeyFromVerificationMethod(tenant.verificationMethod)),
            }
          }

          // otherwise throw an error
          throw new CredoError('Issuer does not support did:key or JWK for credential binding')
        }

        await agent.modules.openId4VcHolder.acceptCredentialOfferUsingPreAuthorizedCode(credentialRecord, {
          credentialBindingResolver,
        })

        // TODO: go to credential details screen
        goBack()
      } catch (error) {
        toast({ type: 'error', message: `Failed to accept offer: ${error}` })
        logError(`Failed to accept offer: ${error}`)
      }
    })
  }

  const refuse = () => goBack()

  return (
    <>
      <ModalLoading visible={isAcceptingOffer || isProcessingCode} />
      {credential ? (
        <BaseCredentialOffer
          navigation={navigation}
          credentialDetails={credential}
          accept={accept}
          refuse={refuse}
          enableMainButtons
        />
      ) : null}
    </>
  )
}

export default OpenIdCredentialOffer
