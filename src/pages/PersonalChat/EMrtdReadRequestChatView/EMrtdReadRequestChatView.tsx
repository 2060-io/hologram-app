import { MrtdProblemReportReason } from '@2060.io/credo-ts-didcomm-mrtd'
import React, { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Alert, View } from 'react-native'
import EIdReader from 'react-native-eid-reader'

import { BlueButton, Header, OutlinedBlueButton, State } from '../components'

import EMrtdInstructions from './EMrtdInstructions'
import { Props } from './EMrtdReadRequestChatViewProps'
import getStyles from './styles'

import { Modal, SvgIcon, Text } from '@2060/components/common'
import { useChat, useMobileAgent } from '@2060/hooks/agent'
import { useScreenLock } from '@2060/hooks/providers/ScreenLockProvider'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { MrzInfo, EmrtdReadRequestState } from '@2060/model'
import { log, logError } from '@2060/utils'
import { widthPercentageToDP } from '@2060/utils/responsiveUtils'
import { toast } from '@2060/utils/toast'

const EMrtdReadRequestChatView = (props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { t } = useTranslation()
  const { agent } = useMobileAgent()
  const { chatThread } = useChat()
  const { didcommThreadId } = props
  const [displayInstructionsPopup, setDisplayInstructionsPopup] = useState(false)
  const { forceDisableScreenLock } = useScreenLock()
  const connectionId = chatThread?.data.connectionId

  const dismissPopup = () => setDisplayInstructionsPopup(false)
  const displayPopup = () => setDisplayInstructionsPopup(true)

  const checkIfDeviceCanScan = async () => {
    const isNfcSupported = await EIdReader.isNfcSupported()
    if (!isNfcSupported) {
      toast({ type: 'error', message: t('chat.eMRTDNotSupported'), duration: 3000 })
      return
    }
    const isNfcEnabled = await EIdReader.isNfcEnabled()
    if (!isNfcEnabled) {
      Alert.alert('', t('chat.eMRTDDisabled'), [
        { text: t('general.cancel'), style: 'destructive' },
        { text: t('general.settings'), style: 'default', onPress: () => EIdReader.openNfcSettings() },
      ])
      return
    }
    displayPopup()
  }

  const scan = async () => {
    const mrzInfo = props.metadata?.mrzInfo ? (JSON.parse(props.metadata.mrzInfo) as MrzInfo) : undefined
    log(`Scan pressed. MRZ info: ${JSON.stringify(mrzInfo)}`)
    if (!mrzInfo) {
      dismissPopup()
      toast({ type: 'error', message: t('chat.eMRTDNoMrzInfo'), duration: 5000 })
      return
    }
    try {
      forceDisableScreenLock(true)
      const result = await EIdReader.startReading({
        mrzInfo: {
          birthDate: mrzInfo.birthDate,
          documentNumber: mrzInfo.documentNumber,
          expirationDate: mrzInfo.expirationDate,
        },
        includeRawData: true,
        includeImages: true,
        labels: {
          title: t('chat.eMRTDTitle'),
          cancelButton: t('general.cancel'),
          requestPresentPassport: t('chat.eMRTDRequestPresentPassport'),
          authenticatingWithPassport: t('chat.eMRTDAuthenticatingWithPassport'),
          reading: t('chat.eMRTDReading'),
          activeAuthentication: t('chat.eMRTDActiveAuthentication'),
          successfulRead: t('chat.eMRTDSuccessfulRead'),
          tagNotValid: t('chat.eMRTDTagNotValid'),
          moreThanOneTagFound: t('chat.eMRTDMoreThanOneTagFound'),
          invalidMRZKey: t('chat.eMRTDInvalidMRZKey'),
          error: t('chat.eMRTDError'),
        },
      })
      if (result.status === 'OK') {
        dismissPopup()
        if (!connectionId) return
        await agent?.modules.mrtd.sendEMrtdData({
          connectionId,
          dataGroups: result.dataGroupsBase64,
          threadId: didcommThreadId,
        })
      }
    } catch (error) {
      logError(`Error scanning NFC: ${(error as Error).message}`)
    } finally {
      forceDisableScreenLock(false)
    }
  }

  const refuse = () => {
    if (!connectionId) return
    agent?.modules.mrtd.sendProblemReport({
      connectionId,
      reason: MrtdProblemReportReason.EmrtdRefused,
      threadId: didcommThreadId,
    })
  }

  const footer: Record<EmrtdReadRequestState, React.ReactElement> = {
    refused: <State text={t('chat.eMRTDAborted')} type="error" />,
    received: (
      <View style={styles.buttonsContainer}>
        <OutlinedBlueButton text={t('general.refuse')} onPress={refuse} style={styles.refuseButton} />
        <BlueButton text={t('general.accept')} onPress={checkIfDeviceCanScan} style={styles.acceptButton} />
      </View>
    ),
    scanned: <State text={t('chat.eMRTDScanned')} />,
  }

  return (
    <>
      <Modal visible={displayInstructionsPopup} statusBarTranslucent={false} transparent>
        <EMrtdInstructions scan={scan} dismissPopup={dismissPopup} refuse={refuse} />
      </Modal>
      <View style={styles.container}>
        <Header theme={theme} title={t('chat.eMRTDRequest')} leftIconName="id" />
        <View style={styles.subContainer}>
          <Trans
            i18nKey="chat.eMRTDScanChatInst"
            style={styles.instructions}
            parent={Text}
            components={{
              bold: <Text typography="EuclidCircularA-Bold" style={styles.instructions} />,
            }}
          />
          <SvgIcon name="NFC" width={'100%'} height={widthPercentageToDP('43')} style={styles.icon} />
          {footer[props.metadata.state]}
        </View>
      </View>
    </>
  )
}

export default EMrtdReadRequestChatView
