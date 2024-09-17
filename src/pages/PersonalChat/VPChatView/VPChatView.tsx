import { W3cCredentialRepository } from '@credo-ts/core'
import { ParamListBase, useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { Header } from '../components'

import getStyles from './styles'

import { CardCredentialMainInformation, Text } from '@2060/components/common'
import { useMobileAgent } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { ChatEntryRole } from '@2060/model'
import { CredentialMainInfo } from '@2060/services/agent/display'
import { toast } from '@2060/utils/toast'

type Props = {
  presentedCredentials: string
  role: ChatEntryRole
  verifierName?: string
}

const VPChatView = ({ presentedCredentials, role, verifierName }: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const navigation: StackNavigationProp<ParamListBase> = useNavigation()
  const { agent } = useMobileAgent()

  const presentedCredentialsForDisplay: CredentialMainInfo[] = presentedCredentials
    ? JSON.parse(presentedCredentials)
    : []

  const goToDetails = async (credentialRecordId: string) => {
    // FIXME: generalize for any type of credential
    const credentialRecord = await agent?.dependencyManager
      .resolve(W3cCredentialRepository)
      .findById(agent.context, credentialRecordId)

    if (credentialRecord) {
      navigation.navigate('CredentialDetails', { credentialRecordId })
    } else {
      toast({ type: 'error', message: t('personalChat.noCredentialFound') })
    }
  }

  return (
    <View style={styles.container}>
      <Header theme={theme} title={t('presentationRequest.sent')} leftIconName="id" role={role} />
      <View style={styles.subContainer}>
        <Text style={styles.title} typography="EuclidCircularA-Regular">
          {t('presentationRequest.youPresented', {
            count: presentedCredentialsForDisplay.length,
            verifier: verifierName,
          })}
        </Text>
        {presentedCredentialsForDisplay.map((credential, index) => {
          const isLast = index === presentedCredentialsForDisplay.length - 1
          return (
            <CardCredentialMainInformation
              key={credential.id}
              credentialMainInfo={credential}
              containerStyle={{ marginBottom: isLast ? 0 : 8 }}
              onPress={() => goToDetails(credential.recordId)}
              size="medium"
            />
          )
        })}
      </View>
    </View>
  )
}

export default memo(VPChatView)
