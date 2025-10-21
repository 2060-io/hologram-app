import { MrtdProblemReportReason } from '@2060.io/credo-ts-didcomm-mrtd'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { BlueButton, Header, OutlinedBlueButton, State } from '../components'

import { Props } from './MrzRequestChatViewProps'
import getStyles from './styles'

import { PersonalChatStackParams } from '@2060/components/Navigation/NavigationProps'
import { SvgIcon, Text } from '@2060/components/common'
import { useChat, useMobileAgent } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { MrzRequestState } from '@2060/model'
import { handleCameraPermission } from '@2060/utils/permissions'
import { widthPercentageToDP } from '@2060/utils/responsiveUtils'

const MrzRequestChatView = (props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { t } = useTranslation()
  const { agent } = useMobileAgent()
  const { chatThread } = useChat()
  const navigation: StackNavigationProp<PersonalChatStackParams> = useNavigation()

  const handleScanMrz = async () => {
    const cameraPermission = await handleCameraPermission()
    if (!cameraPermission) return
    navigation.navigate('MRZScanner', { didcommThreadId: props.didcommThreadId })
  }

  const refuse = () => {
    if (!chatThread?.data.connectionId) return
    agent?.modules.mrtd.sendProblemReport({
      connectionId: chatThread.data.connectionId,
      reason: MrtdProblemReportReason.MrzRefused,
      threadId: props.didcommThreadId,
    })
  }

  const footer: Record<MrzRequestState, React.ReactElement> = {
    refused: <State text={t('chat.mrzRefused')} type="error" />,
    received: (
      <View style={styles.buttonsContainer}>
        <OutlinedBlueButton text={t('general.refuse')} onPress={refuse} style={styles.refuseButton} />
        <BlueButton text={t('general.accept')} onPress={handleScanMrz} style={styles.acceptButton} />
      </View>
    ),
    scanned: <State text={t('chat.mrzScanned')} />,
  }

  return (
    <View style={styles.container}>
      <Header theme={theme} title={t('chat.mrzRequest')} leftIconName="id" />
      <View style={styles.subContainer}>
        <Text style={styles.instructions}>{t('chat.mrzScanChatInst')}</Text>
        <SvgIcon name="MRZ" width={'100%'} height={widthPercentageToDP('43')} style={styles.icon} />
        {footer[props.metadata.state]}
      </View>
    </View>
  )
}

export default MrzRequestChatView
