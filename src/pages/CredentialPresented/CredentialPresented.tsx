import { StackActions } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity } from 'react-native'

import getStyles from './styles'

import { CredentialPresented } from '@src/components'
import { NavigationStackParams } from '@src/components/Navigation/NavigationProps'
import { Text } from '@src/components/common'
import { useChats, useMobileAgent } from '@src/hooks/agent'
import { useTheme } from '@src/hooks/providers/ThemeProvider'

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
    const connections = await agent.didcomm.connections.findByInvitationDid(verifier.did)
    if (connections.length) {
      const [connection] = connections
      const chatThreadId = findOrCreateThread({ connection }).id
      navigation.dispatch(
        StackActions.replace('ChatStack', {
          screen: 'Chat',
          params: { chatThreadId },
        }),
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
