import { StackScreenProps } from '@react-navigation/stack'
import { Credentials } from '@src/components'
import { Text } from '@src/components/common'
import { NavigationStackParams } from '@src/components/Navigation/NavigationProps'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import getStyles from './styles'

type Props = StackScreenProps<NavigationStackParams, 'PresentCredentialsFromChat'>

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
