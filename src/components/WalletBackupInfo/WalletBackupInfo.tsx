import React from 'react'
import { useTranslation } from 'react-i18next'
import { View, ActivityIndicator, TouchableOpacity } from 'react-native'

import getStyles from './styles'

import { Text, SvgIcon, MainButton } from '@src/components/common'
import { IS_ANDROID, IS_IOS } from '@src/constants'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import {
  WalletBackupInfoProps,
  WalletBackupHandlerProps,
} from '@src/pages/Settings/WalletBackup/WalletBackupProps'
import { getFileSize } from '@src/utils'
import { dateToString } from '@src/utils/dateUtils'

const WalletBackupInfoHandler = ({
  containerStyle,
  backupInfoHandler,
  onLoading,
  onInfo,
  onNotExist,
  onError,
}: WalletBackupHandlerProps) => (
  <View style={containerStyle}>
    {backupInfoHandler?.isFetching && onLoading()}
    {backupInfoHandler?.backup && onInfo(backupInfoHandler.backup)}
    {backupInfoHandler?.error && onError()}
    {!backupInfoHandler?.isFetching &&
      !backupInfoHandler?.backup &&
      !backupInfoHandler?.error &&
      onNotExist()}
  </View>
)

const WalletBackupInfo = ({
  backupInfoHandler,
  withSuggestionMessage = true,
  selectAccount = () => {},
  selectedGoogleAccount,
  isBuildingBackup,
}: WalletBackupInfoProps) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)

  const renderGoogleSelectedAccount = () => {
    if (IS_IOS || !selectedGoogleAccount) return null
    return (
      <TouchableOpacity onPress={selectAccount} disabled={isBuildingBackup}>
        <Text fontFamily="EuclidCircularA-Medium" style={[styles.smallText, styles.suggestionText]}>
          {t('settings.googleAccount')}
        </Text>
        <Text style={[styles.smallText]}>{selectedGoogleAccount}</Text>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.backupInfoContainer}>
      <View style={styles.iconContainer}>
        <SvgIcon name="cloudDownload" width={'60%'} height={'60%'} fill={'#A1B0B5'} />
      </View>
      <WalletBackupInfoHandler
        backupInfoHandler={backupInfoHandler}
        containerStyle={styles.subContainer}
        onLoading={() => <ActivityIndicator size="large" color={theme.colors.green} />}
        onInfo={backupInfo => (
          <>
            <Text fontFamily="EuclidCircularA-Medium" style={styles.mediumText}>
              {`${t('settings.lastBackup')}: ${dateToString(backupInfo.modifyDate, 'DD/MM/YYYY h:mm a')}`}
            </Text>
            <Text fontFamily="EuclidCircularA-Medium" style={styles.mediumText}>
              {`${t('settings.backupSize')}: ${getFileSize(Number(backupInfo.size))}`}
            </Text>
            {renderGoogleSelectedAccount()}
            {withSuggestionMessage && (
              <Text style={[styles.smallText, styles.suggestionText]}>
                {t('settings.backupSuggestion', { cloud: IS_IOS ? 'iCloud Drive' : 'Google Drive' })}
              </Text>
            )}
          </>
        )}
        onNotExist={() => (
          <>
            <Text fontFamily="EuclidCircularA-Medium" style={styles.mediumText}>
              {t('settings.noBackupFound')}
            </Text>
            {IS_IOS && (
              <Text fontFamily="EuclidCircularA-Medium" style={styles.smallText}>
                {t('settings.cloudNotSync')}
              </Text>
            )}
            {renderGoogleSelectedAccount()}
          </>
        )}
        onError={() => (
          <View>
            <Text fontFamily="EuclidCircularA-Medium" style={styles.smallText}>
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
