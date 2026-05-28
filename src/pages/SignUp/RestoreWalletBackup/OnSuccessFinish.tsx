import { MainButton, Progress, Text } from '@src/components/common'
import { useUserProfile } from '@src/hooks/agent'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import getStyles from './styles'

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
      <Text style={styles.title} fontFamily="EuclidCircularA-Medium">
        {t('signUp.restoringWalletFromBackup')}
      </Text>
      <View style={styles.card}>
        <Text style={styles.downloadProgress}>{`${t('signUp.restoringWallet')}... 100% ${t('done')}`}</Text>
        <Progress progress={100} progressColor={theme.colors.green} />
      </View>
      <Text style={styles.text}>{t('signUp.successfullyRestored', { name: userProfileData?.displayName })}</Text>
      <MainButton onPress={goToHomeScreen} text={t('getStarted')} style={styles.continueButton} />
    </>
  )
}

export default OnSuccessFinish
