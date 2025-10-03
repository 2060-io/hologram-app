import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { View, TouchableOpacity, Platform, SafeAreaView, ScrollView } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import Share, { ShareOptions } from 'react-native-share'

import { UserInvitationProps } from './UserInvitationProps'
import getStyles from './styles'
import withUserInvitation from './withUserInvitation'

import { Avatar, Text, SvgIcon } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { getGlobalStyles } from '@2060/styles/globalStyles'
import { log } from '@2060/utils'
import { getPictureDataUrl } from '@2060/utils/connectionUtils'
import { widthPercentageToDP } from '@2060/utils/responsiveUtils'

const UserInvitation = ({
  navigation,
  invitation,
  userProfileData,
  createNewInvitation,
}: UserInvitationProps) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const globalStyles = getGlobalStyles(theme)
  const { url, displayName } = invitation

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
        }),
      )
    } catch (error) {
      log('Error sharing', error)
    }
  }

  const handleChangeOptionsHeader = () => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity style={styles.btnDone} onPress={() => navigation.goBack()}>
          <Text typography="EuclidCircularA-Medium" style={styles.headerText}>
            {t('chat.done')}
          </Text>
        </TouchableOpacity>
      ),
      headerStyle: globalStyles.headerStyle,
      headerRight: () => (
        <TouchableOpacity style={styles.btnRefresh} onPress={createNewInvitation}>
          <Text typography="EuclidCircularA-Medium" style={styles.headerText}>
            {t('invitation.refresh')}
          </Text>
        </TouchableOpacity>
      ),
    })
  }

  useEffect(handleChangeOptionsHeader, [theme])

  return (
    <SafeAreaView style={styles.containerRoot}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.containerContent}>
          <Avatar
            uri={getPictureDataUrl(userProfileData?.displayPicture)}
            label={userProfileData?.displayName}
            size="46%"
          />
          <Text typography="EuclidCircularA-Medium" style={styles.displayName}>
            {userProfileData?.displayName}
          </Text>
          <View style={styles.containerCardQR}>
            <QRCode
              size={widthPercentageToDP('70%')}
              color={theme.colors.black}
              backgroundColor={theme.colors.white}
              value={url}
            />
          </View>
          <TouchableOpacity style={styles.containerBtnShare} activeOpacity={0.6} onPress={shareInvitation}>
            <SvgIcon name="shareSocial" fill={theme.colors.white} />
            <Text typography="EuclidCircularA-Medium" style={styles.btnShareText}>
              {t('connection.share')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default withUserInvitation(UserInvitation)
