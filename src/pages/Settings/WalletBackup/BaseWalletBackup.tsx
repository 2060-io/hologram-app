import { ParamListBase, useIsFocused, useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, View, SafeAreaView } from 'react-native'

import Building from './Building'
import Options from './Options'
import PasswordDoesNotExists from './PasswordDoesNotExists'
import { WalletBackupProps } from './WalletBackupProps'
import getStyles from './styles'

import { WalletBackupInfo } from '@2060/components'
import { Text, Switch, SvgIcon, MainButton } from '@2060/components/common'
import { Option } from '@2060/components/common/OptionsList'
import { IS_ANDROID, IS_IOS } from '@2060/constants'
import { useGlobalBuildBackup } from '@2060/hooks/providers/BuildBackupProvider'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { getBackupKey } from '@2060/utils/walletBackUpUtils'

const BaseWalletBackup = ({
  isCloudAvailable,
  uploadBackupToCloud,
  backupInfoHandler,
  selectAccount = () => {},
  selectedGoogleAccount,
}: WalletBackupProps) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { backupState, includeVideos, onToggleIncludeVideos, abortRetryBackup } = useGlobalBuildBackup()
  const [backupPassword, setBackupPassword] = useState<string | undefined>('')
  const navigation: StackNavigationProp<ParamListBase> = useNavigation()
  const isFocused = useIsFocused()

  useEffect(() => {
    const getStoredBackupPassword = async () => {
      const storedBackup = await getBackupKey()
      setBackupPassword(storedBackup)
    }
    isFocused && getStoredBackupPassword()
  }, [isFocused])

  const goToChangePassword = () => navigation.navigate('ChangeBackupPassword')

  const options: Option[] = [
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
              backupInfoHandler={backupInfoHandler}
              selectAccount={selectAccount}
              selectedGoogleAccount={selectedGoogleAccount}
              isBuildingBackup={backupState.isBuildingBackup}
            />
            {backupPassword ? (
              backupState.isBuildingBackup || backupState.error ? (
                <Building
                  backupState={backupState}
                  startBackupProcess={uploadBackupToCloud}
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
                  startBackupProcess={uploadBackupToCloud}
                />
              )
            ) : (
              !backupInfoHandler?.error &&
              !backupInfoHandler?.isFetching && (
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
          <Text fontFamily="EuclidCircularA-Medium" style={styles.makePasswordText}>
            {t('settings.noCloudAvailable', {
              cloud: IS_IOS ? 'iCloud Drive' : 'Google Drive',
            })}
          </Text>
          {IS_ANDROID && <MainButton text={t('general.retry')} onPress={selectAccount} />}
        </View>
      )}
    </SafeAreaView>
  )
}

export default BaseWalletBackup
