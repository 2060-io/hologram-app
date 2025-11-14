import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Platform, TouchableOpacity, View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import Share, { ShareOptions } from 'react-native-share'

import getStyles from './styles'
import { State, usePresentCredentialAsQR } from './usePresentCredentialAsQR'

import { CredentialPresented } from '@2060/components'
import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { MainButton, ModalLoading, SvgIcon, Text } from '@2060/components/common'
import { IS_IOS } from '@2060/constants'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { logError } from '@2060/utils'
import { widthPercentageToDP } from '@2060/utils/responsiveUtils'

interface Props extends StackScreenProps<NavigationStackParams, 'PresentCredentialAsQR'> {}

const PresentCredentialAsQR = ({ navigation, route }: Props) => {
  const { credentialRecordId, attributesToPresent } = route.params
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { state, urlForQr, credentialPresentedInfo, refreshQRCode } = usePresentCredentialAsQR({
    credentialRecordId,
    attributesToPresent,
    navigation,
  })
  const goBackToCredentialDetails = () => navigation.pop(2)

  useEffect(() => {
    if (IS_IOS) return
    const unsubscribe = navigation.addListener('beforeRemove', e => {
      if (e.data.action.type === 'GO_BACK') e.preventDefault()
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => null,
      headerRight: () => (
        <TouchableOpacity style={styles.headerRight} onPress={goBackToCredentialDetails}>
          <Text fontFamily="EuclidCircularA-Medium" style={styles.headerRightText}>
            {t('general.done')}
          </Text>
        </TouchableOpacity>
      ),
    })
  }, [])

  const shareShortenedUrl = async () => {
    try {
      const title = t('credential.shareQrTitle')
      await Share.open(
        Platform.select<ShareOptions>({
          ios: {
            failOnCancel: false,
            activityItemSources: [
              {
                placeholderItem: { type: 'url', content: urlForQr },
                item: { default: { type: 'url', content: urlForQr } },
                linkMetadata: { originalUrl: urlForQr, url: urlForQr, title },
              },
            ],
          },
          default: { url: urlForQr, failOnCancel: false },
        }),
      )
    } catch (error) {
      logError('Error sharing credential QR', error)
    }
  }

  const renderContent: Record<State, React.JSX.Element | null> = {
    creating: <ModalLoading visible />,
    created: (
      <View style={styles.generatedContainer}>
        <Text style={styles.generatedTitle}>{t('credential.generatedQRTitle')}</Text>
        <View style={styles.containerCardQR}>
          <QRCode
            size={widthPercentageToDP('70%')}
            color={theme.colors.black}
            backgroundColor={theme.colors.white}
            value={urlForQr}
          />
        </View>
        <MainButton onPress={shareShortenedUrl} text={t('connection.share')} iconName="shareSocial" />
      </View>
    ),
    expiredShortenedUrl: (
      <>
        <View style={styles.subContainerScannedOrExpired}>
          <Text style={styles.commonText}>{t('credential.expiredQR')}</Text>
        </View>
        <View style={styles.containerButtonScannedOrExpired}>
          <MainButton text={t('invitation.refresh')} onPress={refreshQRCode} />
        </View>
      </>
    ),
    scanned: (
      <>
        <View style={styles.subContainerScannedOrExpired}>
          <Text style={styles.commonText}>{t('credential.scannedQR')}</Text>
          <ActivityIndicator size="large" color={theme.colors.green} />
        </View>
        <View style={styles.containerButtonScannedOrExpired}>
          <MainButton text={t('general.cancel')} onPress={goBackToCredentialDetails} />
        </View>
      </>
    ),
    approved: credentialPresentedInfo ? (
      <CredentialPresented {...credentialPresentedInfo} type="approved" />
    ) : null,
    rejected: credentialPresentedInfo ? (
      <CredentialPresented {...credentialPresentedInfo} type="rejected" />
    ) : null,
    timeoutWaiting: (
      <View style={styles.timeoutWaitingContainer}>
        <Text style={styles.commonText}>{t('credential.noResponseFromVerifier')}</Text>
        <View style={styles.timeoutWaitingIconContainer}>
          <SvgIcon fill={theme.colors.white} name="close" width={64} height={64} />
        </View>
      </View>
    ),
  }

  return <View style={styles.container}>{renderContent[state]}</View>
}

export default PresentCredentialAsQR
