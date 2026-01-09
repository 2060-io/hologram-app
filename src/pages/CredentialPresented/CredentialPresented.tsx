import { StackActions } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity } from 'react-native'

import getStyles from './styles'

import { CredentialPresented } from '@2060/components'
import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { Text } from '@2060/components/common'
import { useChats, useMobileAgent } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'

interface Props extends StackScreenProps<NavigationStackParams, 'CredentialPresented'> {}

const CredentialPresentedPage = ({ navigation, route }: Props) => {
  const { verifier, credentials } = route.params
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { agent } = useMobileAgent()
  const { findOrCreateThread } = useChats()

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity style={styles.headerRight} onPress={goToChatScreen}>
          <Text fontFamily="EuclidCircularA-Medium" style={styles.headerRightText}>
            {t('general.done')}
          </Text>
        </TouchableOpacity>
      ),
    })
  }, [])

  const goToChatScreen = async () => {
    if (!agent) return
    const connections = await agent.connections.findByInvitationDid(verifier.did)
    if (connections.length) {
      const [connection] = connections
      const chatThreadId = findOrCreateThread({ connection }).id
      navigation.dispatch(
        StackActions.replace('PersonalChatStack', { screen: 'PersonalChat', params: { chatThreadId } }),
      )
    }
  }

  return (
    <CredentialPresented
      credentials={credentials}
      verifierName={verifier.name}
      verifierPicture={verifier.logoUrl}
      viewInChatButton={goToChatScreen}
      type="approved"
    />
  )
}

export default CredentialPresentedPage
