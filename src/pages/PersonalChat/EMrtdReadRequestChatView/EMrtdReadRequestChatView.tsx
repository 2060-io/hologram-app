import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import EIdReader from 'react-native-eid-reader'

import { BlueButton, Header } from '../components'

import { Props } from './EMrtdReadRequestChatViewProps'
import getStyles from './styles'

import { Text } from '@2060/components/common'
import { useChat, useMobileAgent } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { MrzRequestState } from '@2060/model'
import { log } from '@2060/utils'
import { toast } from '@2060/utils/toast'

const EMrtdReadRequestChatView = (props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { t } = useTranslation()
  const { agent } = useMobileAgent()
  const { chatThread } = useChat()
  const { didcommThreadId } = props
  const canReadeMRTD = props.metadata?.state === 'received'

  const stateToText: Record<MrzRequestState, string> = {
    aborted: t('chat.eMRTDAborted'),
    received: t('chat.eMRTDReceived'),
    scanned: t('chat.eMRTDScanned'),
  }

  const scan = async () => {
    let mrzInfo = props.metadata?.mrzInfo
    log(`Scan pressed. MRZ info: ${JSON.stringify(mrzInfo)}`)
    if (!mrzInfo) {
      toast({ type: 'error', message: 'Cannot find MRZ info' })
      return
    }
    try {
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
        toast({ type: 'success', message: `Passport ${result.data.documentNo} read successfully` })
        await agent?.modules.mrtd.sendEMrtdData({
          connectionId: chatThread?.data.connectionId!,
          dataGroups: result.dataGroupsBase64,
          threadId: didcommThreadId,
        })
      } else {
        toast({ type: 'warning', message: `Passport read aborted. Status: ${result.status}` })
      }
    } catch (error) {
      toast({ type: 'error', message: `Error: ${(error as Error).message}` })
    }
  }
  return (
    <View style={styles.container}>
      <Header theme={theme} title={t('chat.eMRTDRequest')} leftIconName="id" />
      <View style={styles.subContainer}>
        <Text style={styles.title} typography="EuclidCircularA-Regular">
          Please read your eMRTD
        </Text>
      </View>
      <BlueButton
        style={{ opacity: canReadeMRTD ? 1 : 0.5, marginHorizontal: 6 }}
        text={props.metadata?.state ? stateToText[props.metadata.state] : ''}
        onPress={scan}
        disabled={!canReadeMRTD}
      />
    </View>
  )
}

export default EMrtdReadRequestChatView
