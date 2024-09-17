import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { Text, MainButton } from '@2060/components/common'

interface StyleObject {
  [key: string]: Object
}

type Props = {
  styles: StyleObject
  onPress: () => void
}

const PasswordDoesNotExists = ({ styles, onPress }: Props) => {
  const { t } = useTranslation()
  return (
    <>
      <View style={styles.container}>
        <Text typography="EuclidCircularA-Medium" style={styles.setPassText}>
          {t('settings.firsCreatePassBeforeBackup')}
        </Text>
      </View>
      <MainButton iconName="password" text={t('settings.setPassword')} onPress={onPress} />
    </>
  )
}

export default PasswordDoesNotExists
