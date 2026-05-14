import { MainButton, Text } from '@src/components/common'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

interface StyleObject {
  [key: string]: object
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
        <Text fontFamily="EuclidCircularA-Medium" style={styles.setPassText}>
          {t('settings.firsCreatePassBeforeBackup')}
        </Text>
      </View>
      <MainButton iconName="password" text={t('settings.setPassword')} onPress={onPress} />
    </>
  )
}

export default PasswordDoesNotExists
