import { StackScreenProps } from '@react-navigation/stack'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import getStyles from './styles'

import { Credentials } from '@2060/components'
import { PersonalChatStackParams } from '@2060/components/Navigation/NavigationProps'
import { Text } from '@2060/components/common'
import { usePresentCredential } from '@2060/hooks'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'

interface Props extends StackScreenProps<PersonalChatStackParams, 'PresentCredentialsFromChat'> {}

const PresentCredentialsFromChat = ({ navigation, route }: Props) => {
  const { connectionId } = route.params
  const { t } = useTranslation()
  const { present } = usePresentCredential()
  const theme = useTheme()
  const styles = getStyles(theme)

  const presentCredential = useCallback(async (credentialRecordId: string) => {
    present(credentialRecordId, [connectionId], navigation)
  }, [])

  return (
    <View>
      <Text typography="EuclidCircularA-Regular" style={styles.title}>
        {t('credential.selectCredential')}
      </Text>
      <Credentials
        navigation={navigation}
        headerTitle={t('credential.present')}
        onPressCredential={presentCredential}
      />
    </View>
  )
}

export default PresentCredentialsFromChat
