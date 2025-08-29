import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, View, SafeAreaView } from 'react-native'

import Building from './Building'
import Options from './Options'
import PasswordDoesNotExists from './PasswordDoesNotExists'
import { WalletBackupProps } from './WalletBackupProps'
import getStyles from './styles'

import { WalletBackupInfo, ModalConfirmAction } from '@2060/components'
import { Text, Switch, SvgIcon, MainButton } from '@2060/components/common'
import { IS_ANDROID, IS_IOS } from '@2060/constants'
import { useBuildBackup } from '@2060/hooks'
import { BackupProgressProps } from '@2060/hooks/backup'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'

export const backupProgressInitialValues: BackupProgressProps = {
  progress: 0,
  isUploadingBackup: false,
  error: '',
}

const BaseWalletBackup = ({
  isCloudAvailable,
  makeBackup,
  backupHandler,
  uploadProgress,
  setUploadProgress,
  selectAccount = () => {},
  selectedGoogleAccount,
}: WalletBackupProps) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)

  const {
    backupPassword,
    startBackupProcess,
    abortRetryBackup,
    goToChangePassword,
    includeVideos,
    onToggleIncludeVideos,
    showConfirmLeaveScreen,
    closeConfirmLeaveScreen,
    leaveScreen,
  } = useBuildBackup({
    backupProgressInitialValues,
    uploadBackup: makeBackup,
    uploadProgress,
    setUploadProgress,
  })

  const options = [
    {
      iconName: 'videoBox',
      text: t('settings.includeVideos'),
      rightContent: () => <Switch isChecked={includeVideos} onToggle={onToggleIncludeVideos} />,
    },
    {
      iconName: 'password',
      text: t('settings.changePassword'),
      onPress: goToChangePassword,
      rightContent: () => (
        <SvgIcon name="chevronForward" width={18} height={18} fill={theme.colors.tertiaryText} />
      ),
    },
  ]

  return (
    <SafeAreaView style={styles.container}>
      {isCloudAvailable ? (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.subContainer}>
            <WalletBackupInfo
              backupHandler={backupHandler}
              selectAccount={selectAccount}
              selectedGoogleAccount={selectedGoogleAccount}
            />
            {backupPassword ? (
              uploadProgress.isUploadingBackup || uploadProgress.error ? (
                <Building
                  uploadProgress={uploadProgress}
                  startBackupProcess={startBackupProcess}
                  abortRetryBackup={abortRetryBackup}
                />
              ) : (
                <Options
                  options={options}
                  styles={{
                    container: styles.card,
                    rowContainer: styles.rowContainer,
                    mediumText: styles.mediumText,
                  }}
                  tertiaryText={theme.colors.tertiaryText}
                  startBackupProcess={startBackupProcess}
                />
              )
            ) : (
              !backupHandler?.error &&
              !backupHandler?.isFetching && (
                <PasswordDoesNotExists
                  styles={{
                    container: [styles.card, styles.passwordDoesNotExistsContainer],
                    setPassText: styles.setPassText,
                  }}
                  onPress={goToChangePassword}
                />
              )
            )}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.subContainer}>
          <Text typography="EuclidCircularA-Medium" style={styles.makePasswordText}>
            {t('settings.noCloudAvailable', {
              cloud: IS_IOS ? 'iCloud Drive' : 'Google Drive',
            })}
          </Text>
          {IS_ANDROID && <MainButton text={t('general.retry')} onPress={selectAccount} />}
        </View>
      )}
      <ModalConfirmAction
        visible={showConfirmLeaveScreen}
        title={t('settings.abortBackupBuild')}
        subTitle={''}
        confirmText={t('settings.yesAbort')}
        cancelText={'No'}
        onClose={closeConfirmLeaveScreen}
        onConfirm={leaveScreen}
        onCancel={closeConfirmLeaveScreen}
      />
    </SafeAreaView>
  )
}

export default BaseWalletBackup
