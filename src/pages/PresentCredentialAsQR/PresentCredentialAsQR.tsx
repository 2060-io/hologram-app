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
import { MainButton, ModalLoading, Text } from '@2060/components/common'
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
  const { state, urlForQr, credentialPresentedInfo } = usePresentCredentialAsQR({
    credentialRecordId,
    attributesToPresent,
    navigation,
  })

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
        <TouchableOpacity style={styles.headerRight} onPress={() => navigation.pop(2)}>
          <Text fontFamily="EuclidCircularA-Medium" style={styles.headerRightText}>
            {t('general.done')}
          </Text>
        </TouchableOpacity>
      ),
    })
  }, [])

  const shareShortenedUrl = async () => {
    try {
      const title = 'This is my credential QR'
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
          default: { title, message: title, url: urlForQr, failOnCancel: false },
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
    scanned: (
      <>
        <View style={styles.subContainerScanned}>
          <Text style={styles.scannedText}>{t('credential.scannedQR')}</Text>
          <ActivityIndicator size="large" color={theme.colors.green} />
        </View>
        <View style={styles.cancelButtonContainer}>
          <MainButton text={t('general.cancel')} onPress={() => navigation.goBack()} />
        </View>
      </>
    ),
    approved: credentialPresentedInfo ? (
      <CredentialPresented {...credentialPresentedInfo} type="approved" />
    ) : null,
    rejected: credentialPresentedInfo ? (
      <CredentialPresented {...credentialPresentedInfo} type="rejected" />
    ) : null,
    timeoutWaiting: <Text>Other side does not respond within limit time</Text>,
  }

  return <View style={styles.container}>{renderContent[state]}</View>
}

export default PresentCredentialAsQR
