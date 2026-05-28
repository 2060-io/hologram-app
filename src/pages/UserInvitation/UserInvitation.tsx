import { Avatar, MainButton, Text } from '@src/components/common'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { getGlobalStyles } from '@src/styles'
import { logError } from '@src/utils'
import { getPictureDataUrl } from '@src/utils/connectionUtils'
import { widthPercentageToDP } from '@src/utils/responsiveUtils'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform, TouchableOpacity, View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import Share, { ShareOptions } from 'react-native-share'
import getStyles from './styles'
import { UserInvitationProps } from './UserInvitationProps'
import withUserInvitation from './withUserInvitation'

const UserInvitation = ({ navigation, invitation, userProfileData, createNewInvitation }: UserInvitationProps) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const globalStyles = getGlobalStyles(theme)
  const { url, displayName } = invitation

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity style={styles.btnDone} onPress={() => navigation.goBack()}>
          <Text fontFamily="EuclidCircularA-Medium" style={styles.headerText}>
            {t('chat.done')}
          </Text>
        </TouchableOpacity>
      ),
      headerStyle: globalStyles.headerStyle,
      headerRight: () => (
        <TouchableOpacity style={styles.btnRefresh} onPress={createNewInvitation}>
          <Text fontFamily="EuclidCircularA-Medium" style={styles.headerText}>
            {t('invitation.refresh')}
          </Text>
        </TouchableOpacity>
      ),
    })
  }, [theme])

  const shareInvitation = async () => {
    const title = t('scanned.titleShare', { displayName })
    try {
      await Share.open(
        Platform.select<ShareOptions>({
          ios: {
            failOnCancel: false,
            activityItemSources: [
              {
                placeholderItem: { type: 'url', content: url },
                item: { default: { type: 'url', content: url } },
                linkMetadata: { originalUrl: url, url, title },
              },
            ],
          },
          default: { title, url, message: title, failOnCancel: false },
        })
      )
    } catch (error) {
      logError('Error sharing invitation', error)
    }
  }

  return (
    <View style={styles.container}>
      <Avatar
        uri={userProfileData?.displayPicture ? getPictureDataUrl(userProfileData.displayPicture) : undefined}
        label={userProfileData?.displayName}
        size="46%"
      />
      <Text fontFamily="EuclidCircularA-Medium" style={styles.displayName}>
        {userProfileData?.displayName}
      </Text>
      <View>
        <View style={styles.containerCardQR}>
          <QRCode
            size={widthPercentageToDP('70%')}
            color={theme.colors.black}
            backgroundColor={theme.colors.white}
            value={url}
          />
        </View>
        <Text style={styles.pressRefreshText}>{t('invitation.pressRefresh')}</Text>
      </View>
      <MainButton onPress={shareInvitation} text={t('connection.share')} iconName="shareSocial" />
    </View>
  )
}

export default withUserInvitation(UserInvitation)
