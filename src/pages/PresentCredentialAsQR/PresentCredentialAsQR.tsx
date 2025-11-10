import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Platform, View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import Share, { ShareOptions } from 'react-native-share'

import getStyles from './styles'
import { State, usePresentCredentialAsQR } from './usePresentCredentialAsQR'

import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { MainButton, Modal, ModalLoading, Text } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { logError } from '@2060/utils'
import { widthPercentageToDP } from '@2060/utils/responsiveUtils'

interface Props extends StackScreenProps<NavigationStackParams, 'PresentCredentialAsQR'> {}

const PresentCredentialAsQR = ({ navigation, route }: Props) => {
  const { credentialRecordId, attributesToPresent } = route.params
  const { t } = useTranslation()
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const styles = getStyles(theme)
  const { state, urlForQr } = usePresentCredentialAsQR({ credentialRecordId, attributesToPresent })

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

  const renderContent: Record<State, React.JSX.Element> = {
    creating: <ModalLoading visible />,
    created: (
      <>
        <View style={styles.containerCardQR}>
          <QRCode
            size={widthPercentageToDP('70%')}
            color={theme.colors.black}
            backgroundColor={theme.colors.white}
            value={urlForQr}
          />
        </View>
        <MainButton onPress={shareShortenedUrl} text={t('connection.share')} iconName="shareSocial" />
      </>
    ),
    errorCreating: <Text style={styles.errorCreatingText}>{t('credential.errorCreatingQR')}</Text>,
    scanned: (
      <Modal visible>
        <SafeAreaView style={styles.containerScanned}>
          <View style={styles.subContainerScanned}>
            <Text style={styles.scannedText}>Other side scan QR, please wait</Text>
            <ActivityIndicator size="large" color={theme.colors.green} />
          </View>
          <MainButton
            text={t('general.cancel')}
            onPress={() => navigation.goBack()}
            style={{ marginBottom: insets.bottom }}
          />
        </SafeAreaView>
      </Modal>
    ),
    approved: <Text>approved</Text>,
    rejected: <Text>rejected</Text>,
    timeoutWaiting: <Text>Other side does not respond within limit time</Text>,
  }

  return <View style={styles.container}>{renderContent[state]}</View>
}

export default PresentCredentialAsQR
