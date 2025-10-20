import { OrientationLock, lockAsync, unlockAsync } from 'expo-screen-orientation'
import React, { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, TouchableOpacity, View, SafeAreaView } from 'react-native'
import { SvgUri } from 'react-native-svg'
import WebView from 'react-native-webview'

import { Header, BlueButton } from '../components'

import { HtmlChatViewProps } from './HtmlChatViewProps'
import getStyles from './styles'

import { Modal, SvgIcon, Text } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { log, logError } from '@2060/utils'

const extractDomainFromUrl = (url: string) => {
  const domainRegex = /^(?:https?:\/\/)?(?:www\.)?([^/]+)/
  const matches = url.match(domainRegex)
  return matches ? matches[1] : null
}

const HtmlChatView = (props: HtmlChatViewProps) => {
  const { metadata, renderCustomHeader } = props
  const { openingMode, screenOrientation } = metadata
  const [isFullScreen, setFullScreen] = useState(openingMode === 'fullScreen')
  const [isShowingWebView, setShowingWebView] = useState(false)

  const theme = useTheme()
  const { t } = useTranslation()
  const styles = getStyles(theme)

  const isValidUrl = metadata.uri ? Boolean(new URL(metadata.uri)) : false
  const isUrlSecure = isValidUrl && metadata.uri?.startsWith('https')
  const dimensions = isFullScreen ? styles.fullScreenDimensions : styles.normalScreenDimensions
  const iconNameMiniOrMaxi = isFullScreen ? 'minimize' : 'maximize'

  const changeScreenMode = () => setFullScreen(prevState => !prevState)
  const showWebView = () => setShowingWebView(true)

  const setScreenOrientation = async () => {
    const screenOrientationMap = {
      portrait: OrientationLock.PORTRAIT_UP,
      landscape: OrientationLock.LANDSCAPE_LEFT,
    }

    if (screenOrientation) await lockAsync(screenOrientationMap[screenOrientation])
  }
  const resetScreenOrientation = () => unlockAsync()

  const closeWebView = () => {
    setShowingWebView(false)
    setFullScreen(false)
    resetScreenOrientation()
  }

  const handleImageError = (error: unknown) => logError('Error loading embedded web view image', error)

  const renderMainInfo = () => (
    <React.Fragment>
      <Header theme={theme} title={t('personalChat.webLink')} leftIconName="link" />
      <View style={styles.metadataContainer}>
        {metadata.icon &&
          (metadata.icon?.endsWith('.svg') ? (
            <SvgUri
              uri={metadata.icon}
              height={styles.image.height}
              width={styles.image.width}
              onError={handleImageError}
            />
          ) : (
            <Image style={styles.image} source={{ uri: metadata.icon }} onError={handleImageError} />
          ))}
        <View style={styles.detailsContainer}>
          <Text style={styles.title}>{metadata.title}</Text>
          <Text style={styles.description}>{metadata.description}</Text>
          <Text
            style={{
              fontSize: theme.fontSize.sm,
              color: isUrlSecure ? theme.colors.green : theme.colors.orange,
            }}
          >
            {metadata.uri && extractDomainFromUrl(metadata.uri)}
          </Text>
        </View>
      </View>
    </React.Fragment>
  )

  const renderWebView = () => (
    <React.Fragment>
      <View style={styles.webViewButtonsContainer}>
        <TouchableOpacity onPress={closeWebView}>
          <SvgIcon name="close" width={30} height={30} fill={theme.colors.secondaryGrey} />
        </TouchableOpacity>
        <TouchableOpacity onPress={changeScreenMode}>
          <SvgIcon name={iconNameMiniOrMaxi} width={30} height={30} fill={theme.colors.secondaryGrey} />
        </TouchableOpacity>
      </View>
      <WebView
        style={styles.webView}
        startInLoadingState
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
        onError={event => logError('error loading web view', event)}
        source={{ uri: metadata.uri }}
        onLoadStart={setScreenOrientation}
        onMessage={event => {
          log('WebView onMessage event', event.nativeEvent)
          closeWebView()
        }}
        //Android only
        nestedScrollEnabled
        showsHorizontalScrollIndicator
      />
    </React.Fragment>
  )

  return (
    <View style={styles.container}>
      {renderMainInfo()}
      <BlueButton
        style={[styles.openWebViewButton, isUrlSecure ? styles.secureUrlButton : styles.unsecureUrlButton]}
        text={isUrlSecure ? t('general.open') : t('chat.unsecureLink')}
        onPress={showWebView}
        disabled={!isValidUrl}
      />
      {openingMode === 'embedded' ? (
        <View style={[isShowingWebView ? { ...styles.displayWebView, ...dimensions } : styles.hideWebView]}>
          {renderWebView()}
        </View>
      ) : (
        <Modal
          visible={isShowingWebView}
          transparent
          supportedOrientations={['portrait', 'landscape']}
          statusBarTranslucent={false}
        >
          <SafeAreaView style={styles.fullScreenOpenedContainer}>
            {!isFullScreen && renderCustomHeader({ onSomeActionDispatched: closeWebView })}
            {renderWebView()}
          </SafeAreaView>
        </Modal>
      )}
    </View>
  )
}

/**
 * This component is not being re-rendered due to its not necessary so far.
 * If this components needs to re-render, please make sure do it using the correct properties values
 * who have changed and need to be re-render
 * NOTE: When a face verification is done successfully new messages in chat came, so, it triggers new
 * re-render to this component and the callback onMessage that send the web page does not reach
 * to be called due to the new re-render and function closeWebView() is not called, so,
 * the flows of the life cycle is interrupted and component does not makes what needs when its closed.
 * For instance: if resetScreenOrientation() is not called when finish verification
 * the app is going to keep portrait mode
 */

export default memo(HtmlChatView, () => true)
