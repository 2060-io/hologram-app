import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import getStyles from './styles'

import { Text, MainButton, Progress } from '@2060/components/common'
import { useUserProfile } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'

type Props = {
  goToHomeScreen: () => void
}

const OnSuccessFinish = ({ goToHomeScreen }: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { userProfileData } = useUserProfile()

  return (
    <>
      <Text style={styles.title} typography="EuclidCircularA-Medium">
        {t('signUp.restoringWalletFromBackup')}
      </Text>
      <View style={styles.card}>
        <Text style={styles.downloadProgress}>{`${t('signUp.restoringWallet')}... 100% ${t('done')}`}</Text>
        <Progress progress={100} progressColor={theme.colors.green} />
      </View>
      <Text style={styles.text}>
        {t('signUp.successfullyRestored', { name: userProfileData?.displayName })}
      </Text>
      <MainButton onPress={goToHomeScreen} text={t('getStarted')} style={styles.continueButton} />
    </>
  )
}

export default OnSuccessFinish
