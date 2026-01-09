import { StackScreenProps } from '@react-navigation/stack'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import getStyles from './styles'

import { Credentials } from '@2060/components'
import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { Text } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'

interface Props extends StackScreenProps<NavigationStackParams, 'PresentCredentialsFromChat'> {}

const PresentCredentialsFromChat = ({ navigation, route }: Props) => {
  const { connectionId } = route.params
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)

  const onPressCredential = useCallback((credentialRecordId: string) => {
    navigation.navigate('SelectCredentialAttributes', {
      presentDirectly: true,
      credentialRecordId,
      connectionToPresent: connectionId,
    })
  }, [])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('credential.selectCredential')}</Text>
      <Credentials
        navigation={navigation}
        headerTitle={t('navigation.PresentCredentialsFromChat')}
        onPressCredential={onPressCredential}
      />
    </View>
  )
}

export default PresentCredentialsFromChat
