import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { View, Keyboard, TouchableWithoutFeedback, TouchableOpacity } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { SafeAreaView } from 'react-native-safe-area-context'

import OnSuccessFinish from './OnSuccessFinish'
import { RestoreProps, BaseRestoreWalletBackupProps } from './RestoreWalletBackupProps'
import getStyles from './styles'

import AppLogo from '@src/assets/icons/AppLogo'
import { WalletBackupInfo, ModalConfirmAction } from '@src/components'
import { Text, TextInputPassword, MainButton, SvgIcon, Progress } from '@src/components/common'
import { IS_ANDROID, IS_IOS } from '@src/constants'
import { useRestoreBackup } from '@src/hooks'
import { useTheme } from '@src/hooks/providers/ThemeProvider'

const Restore = ({
  restoreProgress,
  onInitialState,
  onDownloading,
  onError,
  onSuccessFinish,
  style,
}: RestoreProps) => (
  <View style={style}>
    {!restoreProgress.isDownloadingBackUp &&
      !restoreProgress.done &&
      !restoreProgress.error &&
      onInitialState()}
    {restoreProgress.isDownloadingBackUp && onDownloading()}
    {restoreProgress.error && onError()}
    {restoreProgress.done && onSuccessFinish()}
  </View>
)

const BaseRestoreWalletBackup = ({
  isCloudAvailable,
  backupInfoHandler,
  downloadBackup,
  restoreProgress,
  setRestoreProgress,
  selectAccount = () => {},
  selectedGoogleAccount,
}: BaseRestoreWalletBackupProps) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const {
    recoveryPassword,
    setRecoveryPassword,
    showConfirmLeaveScreen,
    closeConfirmLeaveScreen,
    abort,
    restore,
    restoreProgressToInitialValues,
    goToHomeScreen,
    navigation,
  } = useRestoreBackup({
    restoreProgress,
    setRestoreProgress,
    downloadBackup,
  })

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity style={styles.headerLeft} onPress={() => navigation.goBack()}>
          <Text style={styles.headerLeftText} fontFamily="EuclidCircularA-Medium">
            {t('general.cancel')}
          </Text>
        </TouchableOpacity>
      ),
      headerTitle: '',
    })
  }, [])

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        extraScrollHeight={70}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          {isCloudAvailable ? (
            <View style={styles.subContainer}>
              <AppLogo />
              <Restore
                style={styles.restoreContainer}
                restoreProgress={restoreProgress}
                onInitialState={() => (
                  <View>
                    <WalletBackupInfo
                      backupInfoHandler={backupInfoHandler}
                      withSuggestionMessage={false}
                      selectAccount={selectAccount}
                      selectedGoogleAccount={selectedGoogleAccount}
                      isBuildingBackup={false}
                    />
                    {!!backupInfoHandler?.backup && isCloudAvailable && (
                      <>
                        <Text
                          style={[styles.title, styles.recoveryPassText]}
                          fontFamily="EuclidCircularA-Medium"
                        >
                          {t('signUp.enterRecoveryPassword')}
                        </Text>
                        <TextInputPassword onChangeText={setRecoveryPassword} value={recoveryPassword} />
                        <MainButton
                          disabled={!recoveryPassword}
                          onPress={restore}
                          text={t('continue')}
                          style={styles.continueButton}
                        />
                      </>
                    )}
                  </View>
                )}
                onDownloading={() => (
                  <>
                    <Text style={styles.title} fontFamily="EuclidCircularA-Medium">
                      {t('signUp.restoringWalletFromBackup')}
                    </Text>
                    <View style={styles.card}>
                      <Text style={styles.downloadProgress}>
                        {`${t('signUp.restoringWallet')}... ${restoreProgress.progress}% ${t('done')}`}
                      </Text>
                      <Progress progress={restoreProgress.progress} progressColor={theme.colors.green} />
                    </View>
                    <Text style={styles.pleaseWaitText}>{t('signUp.pleaseWaitRestoringBackup')}</Text>
                  </>
                )}
                onError={() => (
                  <>
                    <Text style={styles.title} fontFamily="EuclidCircularA-Medium">
                      {t('signUp.restoringWalletFromBackup')}
                    </Text>
                    <View style={styles.card}>
                      <Text style={styles.downloadProgress}>
                        {`${t('signUp.restoringWallet')}... 0% ${t('done')}`}
                      </Text>
                      <View style={styles.errorSubContainer}>
                        <View style={styles.errorIconContainer}>
                          <SvgIcon name="warning" fill={theme.colors.white} width={20} height={20} />
                        </View>
                        <Text style={styles.errorTitle}>{t('signUp.cannotRestoreWallet')}</Text>
                      </View>
                    </View>
                    <Text style={styles.text}>{restoreProgress.error}</Text>
                    <MainButton
                      onPress={restoreProgressToInitialValues}
                      text={t('tryAgain')}
                      style={styles.errorButton}
                    />
                  </>
                )}
                onSuccessFinish={() => <OnSuccessFinish goToHomeScreen={goToHomeScreen} />}
              />
            </View>
          ) : (
            <View style={styles.subContainer}>
              <Text fontFamily="EuclidCircularA-Medium" style={styles.noCloudAvailable}>
                {t('settings.noCloudAvailable', { cloud: IS_IOS ? 'iCloud Drive' : 'Google Drive' })}
              </Text>
              {IS_ANDROID && <MainButton text={t('general.retry')} onPress={selectAccount} />}
            </View>
          )}
        </TouchableWithoutFeedback>
      </KeyboardAwareScrollView>
      <ModalConfirmAction
        visible={showConfirmLeaveScreen}
        title={t('signUp.abortBackupRestore')}
        subTitle={''}
        confirmText={t('settings.yesAbort')}
        cancelText={'No'}
        onClose={closeConfirmLeaveScreen}
        onConfirm={abort}
        onCancel={closeConfirmLeaveScreen}
      />
    </SafeAreaView>
  )
}

export default BaseRestoreWalletBackup
