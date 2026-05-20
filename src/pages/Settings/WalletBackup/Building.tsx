import { MainButton, OutlinedButton, Progress, SvgIcon, Text } from '@src/components/common'
import { BackupProgressProps } from '@src/hooks/backup'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import getStyles from './styles'

type Props = {
  uploadProgress: BackupProgressProps
  startBackupProcess: () => Promise<void>
  abortRetryBackup: () => void
}

const Building = ({ uploadProgress, startBackupProcess, abortRetryBackup }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { t } = useTranslation()
  const progressColor = uploadProgress.isUploadingBackup ? theme.colors.green : theme.colors.secondaryGrey
  const color = theme.colors.secondaryGrey
  return (
    <>
      <View style={[styles.card, styles.buildingContainer]}>
        <View style={[styles.rowContainer, styles.makingBackupButton]}>
          <SvgIcon name="cloudOff" fill={color} width={26} height={26} />
          <Text style={[styles.mediumText, styles.buildBackupText]}>{t('settings.buildBackup')}</Text>
          <Text style={[styles.mediumText, { color }]}>{`${uploadProgress.progress}%`}</Text>
        </View>
        <Progress progress={uploadProgress.progress} progressColor={progressColor} />
        {uploadProgress.error && (
          <View style={styles.errorContainer}>
            <View style={[styles.rowContainer, styles.errorSubContainer]}>
              <View style={styles.errorIconContainer}>
                <SvgIcon name="warning" fill={theme.colors.white} width={15} height={15} />
              </View>
              <Text style={styles.errorTitle}>{t('settings.buildBackupError')}</Text>
            </View>
            <Text fontFamily="EuclidCircularA-Medium" style={styles.mediumText}>
              {uploadProgress.error}
            </Text>
          </View>
        )}
      </View>
      {uploadProgress.error && (
        <>
          <MainButton text={t('general.retry')} onPress={startBackupProcess} style={styles.retryButton} />
          <OutlinedButton text={t('general.abort')} onPress={abortRetryBackup} />
        </>
      )}
    </>
  )
}

export default Building
