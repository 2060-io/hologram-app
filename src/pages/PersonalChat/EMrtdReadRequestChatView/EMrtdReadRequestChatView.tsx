import React, { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Alert, Modal, View } from 'react-native'
import EIdReader from 'react-native-eid-reader'

import { BlueButton, Header, OutlinedBlueButton, State } from '../components'

import EMrtdInstructions from './EMrtdInstructions'
import { Props } from './EMrtdReadRequestChatViewProps'
import getStyles from './styles'

import { SvgIcon, Text } from '@2060/components/common'
import { useChat, useMobileAgent } from '@2060/hooks/agent'
import { useScreenLock } from '@2060/hooks/providers/ScreenLockProvider'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { MrzInfo, MrzRequestState } from '@2060/model'
import { log } from '@2060/utils'
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
  const { setScreenLockForcedDisabled } = useScreenLock()

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
    let mrzInfo = props.metadata?.mrzInfo ? (JSON.parse(props.metadata.mrzInfo) as MrzInfo) : undefined
    log(`Scan pressed. MRZ info: ${JSON.stringify(mrzInfo)}`)
    if (!mrzInfo) {
      toast({ type: 'error', message: 'Cannot find MRZ info' })
      return
    }
    try {
      setScreenLockForcedDisabled(true)
      const result = await EIdReader.startReading({
        mrzInfo: {
          birthDate: mrzInfo.birthDate,
          documentNumber: mrzInfo.documentNumber,
          expirationDate: mrzInfo.expirationDate,
        },
        includeRawData: true,
        includeImages: true,
      })
      log(`status: ${result.status}`)
      log(`result: ${JSON.stringify(result)}`)
      if (result.status === 'OK') {
        await agent?.modules.mrtd.sendEMrtdData({
          connectionId: chatThread?.data.connectionId!,
          dataGroups: result.dataGroupsBase64,
          threadId: didcommThreadId,
        })
      }
    } catch (error) {
      toast({ type: 'error', message: `Error: ${(error as Error).message}`, duration: 3000 })
    } finally {
      setScreenLockForcedDisabled(false)
    }
  }

  const footer: Record<MrzRequestState, React.ReactElement> = {
    aborted: <State text={t('chat.eMRTDAborted')} type="error" />,
    received: (
      <View style={styles.buttonsContainer}>
        <OutlinedBlueButton text={t('general.refuse')} onPress={() => {}} style={styles.refuseButton} />
        <BlueButton text={t('general.accept')} onPress={checkIfDeviceCanScan} style={styles.acceptButton} />
      </View>
    ),
    scanned: <State text={t('chat.eMRTDScanned')} />,
  }

  return (
    <>
      <Modal visible={displayInstructionsPopup}>
        <EMrtdInstructions scan={scan} dismissPopup={dismissPopup} />
      </Modal>
      <View style={styles.container}>
        <Header theme={theme} title={t('chat.eMRTDRequest')} leftIconName="id" />
        <View style={styles.subContainer}>
          <Trans
            i18nKey={t('chat.eMRTDScanChatInst')}
            typography="EuclidCircularA-Regular"
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
