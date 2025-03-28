import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, View, Keyboard, TouchableWithoutFeedback, TouchableOpacity } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

import OnSuccessFinish from './OnSuccessFinish'
import { RestoreProps, BaseRestoreWalletBackupProps } from './RestoreWalletBackupProps'
import getStyles from './styles'

import AppLogo from '@2060/assets/icons/AppLogo'
import { WalletBackupInfo, ModalConfirmAction } from '@2060/components'
import { Text, TextInputPassword, MainButton, SvgIcon, Progress } from '@2060/components/common'
import { IS_ANDROID, IS_IOS } from '@2060/constants'
import { useRestoreBackup } from '@2060/hooks'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'

const Restore = ({
  restoreProgress,
  onInitialState,
  onDownloading,
  onError,
  onSuccessFinish,
}: RestoreProps) => (
  <View style={{ marginTop: 35, width: '100%' }}>
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
  backupHandler,
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
    goToOnboardingScreen,
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
          <Text style={styles.headerLeftText} typography="EuclidCircularA-Medium">
            {t('general.cancel')}
          </Text>
        </TouchableOpacity>
      ),
      headerTitle: '',
    })
  })

  return (
    <SafeAreaView style={styles.container}>
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
                restoreProgress={restoreProgress}
                onInitialState={() => (
                  <View>
                    <WalletBackupInfo
                      backupHandler={backupHandler}
                      withSuggestionMessage={false}
                      selectAccount={selectAccount}
                      selectedGoogleAccount={selectedGoogleAccount}
                    />
                    {!!backupHandler?.backup && isCloudAvailable && (
                      <>
                        <Text
                          style={[styles.title, styles.recoveryPassText]}
                          typography="EuclidCircularA-Medium"
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
                    <Text style={styles.title} typography="EuclidCircularA-Medium">
                      {t('signUp.restoringWalletFromBackup')}
                    </Text>
                    <View style={styles.card}>
                      <Text typography="EuclidCircularA-Regular" style={styles.downloadProgress}>
                        {`${t('signUp.restoringWallet')}... ${restoreProgress.progress}% ${t('done')}`}
                      </Text>
                      <Progress progress={restoreProgress.progress} progressColor={theme.colors.green} />
                    </View>
                    <Text style={styles.pleaseWaitText} typography="EuclidCircularA-Regular">
                      {t('signUp.pleaseWaitRestoringBackup')}
                    </Text>
                  </>
                )}
                onError={() => (
                  <>
                    <Text style={styles.title} typography="EuclidCircularA-Medium">
                      {t('signUp.restoringWalletFromBackup')}
                    </Text>
                    <View style={styles.card}>
                      <Text typography="EuclidCircularA-Regular" style={styles.downloadProgress}>
                        {`${t('signUp.restoringWallet')}... 0% ${t('done')}`}
                      </Text>
                      <View style={styles.errorSubContainer}>
                        <View style={styles.errorIconContainer}>
                          <SvgIcon name="warning" fill={theme.colors.white} width={20} height={20} />
                        </View>
                        <Text typography="EuclidCircularA-Regular" style={styles.errorTitle}>
                          {t('signUp.cannotRestoreWallet')}
                        </Text>
                      </View>
                    </View>
                    <Text typography="EuclidCircularA-Regular" style={styles.text}>
                      {restoreProgress.error}
                    </Text>
                    <MainButton
                      onPress={restoreProgressToInitialValues}
                      text={t('tryAgain')}
                      style={styles.errorButton}
                    />
                  </>
                )}
                onSuccessFinish={() => <OnSuccessFinish goToOnboardingScreen={goToOnboardingScreen} />}
              />
            </View>
          ) : (
            <View style={styles.subContainer}>
              <Text typography="EuclidCircularA-Medium" style={styles.noCloudAvailable}>
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
