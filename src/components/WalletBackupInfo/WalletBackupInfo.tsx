import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View, ActivityIndicator, TouchableOpacity } from 'react-native'

import getStyles from './styles'

import { Text, SvgIcon, MainButton } from '@2060/components/common'
import { IS_ANDROID, IS_IOS } from '@2060/constants'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import {
  WalletBackupInfoProps,
  WalletBackupHandlerProps,
} from '@2060/pages/Settings/WalletBackup/WalletBackupProps'
import { getFileSize } from '@2060/utils'
import { dateToString } from '@2060/utils/dateUtils'

const WalletBackupHandler = ({
  containerStyle,
  backupHandler,
  onLoading,
  onInfo,
  onNotExist,
  onError,
}: WalletBackupHandlerProps) => (
  <View style={containerStyle}>
    {backupHandler?.isFetching && onLoading()}
    {backupHandler?.backup && onInfo(backupHandler?.backup)}
    {backupHandler?.error && onError()}
    {!backupHandler?.isFetching && !backupHandler?.backup && !backupHandler?.error && onNotExist()}
  </View>
)

const WalletBackupInfo = ({
  backupHandler,
  withSuggestionMessage = true,
  selectAccount = () => {},
  selectedGoogleAccount,
}: WalletBackupInfoProps) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)

  const renderGoogleSelectedAccount = useMemo(() => {
    if (IS_IOS || !selectedGoogleAccount) return null
    return (
      <TouchableOpacity onPress={selectAccount}>
        <Text typography="EuclidCircularA-Medium" style={[styles.smallText, styles.suggestionText]}>
          {t('settings.googleAccount')}
        </Text>
        <Text typography="EuclidCircularA-Regular" style={[styles.smallText]}>
          {selectedGoogleAccount}
        </Text>
      </TouchableOpacity>
    )
  }, [selectedGoogleAccount])

  return (
    <View style={styles.backupInfoContainer}>
      <View style={styles.iconContainer}>
        <SvgIcon name="cloudDownload" width={'60%'} height={'60%'} fill={'#A1B0B5'} />
      </View>
      <WalletBackupHandler
        backupHandler={backupHandler}
        containerStyle={styles.subContainer}
        onLoading={() => <ActivityIndicator size="large" color={theme.colors.green} />}
        onInfo={backupInfo => (
          <>
            <Text typography="EuclidCircularA-Medium" style={styles.mediumText}>
              {`${t('settings.lastBackup')}: ${dateToString(backupInfo.modifyDate, 'DD/MM/YYYY h:mm a')}`}
            </Text>
            <Text typography="EuclidCircularA-Medium" style={styles.mediumText}>
              {`${t('settings.backupSize')}: ${getFileSize(Number(backupInfo.size))}`}
            </Text>
            {renderGoogleSelectedAccount}
            {withSuggestionMessage && (
              <Text typography="EuclidCircularA-Regular" style={[styles.smallText, styles.suggestionText]}>
                {t('settings.backupSuggestion', { cloud: IS_IOS ? 'iCloud Drive' : 'Google Drive' })}
              </Text>
            )}
          </>
        )}
        onNotExist={() => (
          <>
            <Text typography="EuclidCircularA-Medium" style={styles.mediumText}>
              {t('settings.noBackupFound')}
            </Text>
            {IS_IOS && (
              <Text typography="EuclidCircularA-Medium" style={styles.smallText}>
                {t('settings.cloudNotSync')}
              </Text>
            )}
            {renderGoogleSelectedAccount}
          </>
        )}
        onError={() => (
          <View>
            <Text typography="EuclidCircularA-Medium" style={styles.smallText}>
              {t('general.errorGettingBackupInfoFromCloud')}
            </Text>
            {IS_ANDROID && (
              <MainButton text={t('general.retry')} onPress={selectAccount} style={styles.reLoginButton} />
            )}
          </View>
        )}
      />
    </View>
  )
}

export default WalletBackupInfo
