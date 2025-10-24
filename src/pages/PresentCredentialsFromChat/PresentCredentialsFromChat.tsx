import { W3cCredentialRepository } from '@credo-ts/core'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import getStyles from './styles'

import { Credentials, SelectCredentialAttributes } from '@2060/components'
import { PersonalChatStackParams } from '@2060/components/Navigation/NavigationProps'
import { Text } from '@2060/components/common'
import { usePresentCredential } from '@2060/hooks'
import { useMobileAgent } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { getCredentialAttributes } from '@2060/services/agent/display'
import {
  CredentialAttributeTable,
  formatCredentialSubject,
} from '@2060/services/agent/formatCredentialSubject'

interface Props extends StackScreenProps<PersonalChatStackParams, 'PresentCredentialsFromChat'> {}

const PresentCredentialsFromChat = ({ navigation, route }: Props) => {
  const { connectionId } = route.params
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { agent } = useMobileAgent()
  const { present } = usePresentCredential()
  const [showModalSelectAttributesForPresent, setDisplayModalSelectAttributesForPresent] = useState(false)
  const currentAttributesSections = useRef<CredentialAttributeTable[]>([])
  const currentCredentialRecordId = useRef<string>('')

  const displayModalSelectAttributesForPresent = () => setDisplayModalSelectAttributesForPresent(true)

  const hideModalSelectAttributesForPresent = () => setDisplayModalSelectAttributesForPresent(false)

  const onPressCredential = useCallback(async (credentialRecordId: string) => {
    if (!agent) return
    const credentialRecord = await agent.dependencyManager
      .resolve(W3cCredentialRepository)
      .findById(agent.context, credentialRecordId)
    if (!credentialRecord) return
    const credentialAttributes = getCredentialAttributes(credentialRecord)
    const attributesSections = formatCredentialSubject({ subject: credentialAttributes })
    currentAttributesSections.current = attributesSections
    currentCredentialRecordId.current = credentialRecordId
    displayModalSelectAttributesForPresent()
  }, [])

  const presentCredential = useCallback(async (attributesToPresent: string[]) => {
    hideModalSelectAttributesForPresent()
    present(currentCredentialRecordId.current, [connectionId], attributesToPresent, navigation)
  }, [])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('credential.selectCredential')}</Text>
      <Credentials
        navigation={navigation}
        headerTitle={t('credential.present')}
        onPressCredential={onPressCredential}
      />
      <SelectCredentialAttributes
        visible={showModalSelectAttributesForPresent}
        attributesSections={currentAttributesSections.current}
        onRequestClose={hideModalSelectAttributesForPresent}
        onPresent={presentCredential}
        navigate={navigation.navigate}
        credentialRecordId={currentCredentialRecordId.current}
      />
    </View>
  )
}

export default PresentCredentialsFromChat
