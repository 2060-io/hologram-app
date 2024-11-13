import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { BlueButton, Header, OutlinedBlueButton } from '../components'

import { Props } from './MrzRequestChatViewProps'
import getStyles from './styles'

import { PersonalChatStackParams } from '@2060/components/Navigation/NavigationProps'
import { SvgIcon, Text } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { MrzRequestState } from '@2060/model'
import { handleCameraPermission } from '@2060/utils/permissions'
import { widthPercentageToDP } from '@2060/utils/responsiveUtils'

const MrzRequestChatView = (props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { t } = useTranslation()
  const navigation: StackNavigationProp<PersonalChatStackParams> = useNavigation()

  const handleScanMrz = async () => {
    const cameraPermission = await handleCameraPermission()
    if (!cameraPermission) return
    navigation.navigate('MRZScanner', { didcommThreadId: props.didcommThreadId! })
  }

  const footer: Record<MrzRequestState, React.ReactElement> = {
    aborted: (
      <View style={[styles.baseFooterContainer, styles.refusedContainer]}>
        <Text typography="EuclidCircularA-Bold" style={styles.refusedText}>
          {t('chat.mrzAborted')}
        </Text>
      </View>
    ),
    received: (
      <View style={styles.buttonsContainer}>
        <OutlinedBlueButton text={t('general.refuse')} onPress={() => {}} style={styles.refuseButton} />
        <BlueButton text={t('general.accept')} onPress={handleScanMrz} style={styles.acceptButton} />
      </View>
    ),
    scanned: (
      <View style={[styles.baseFooterContainer, styles.acceptedContainer]}>
        <Text typography="EuclidCircularA-Bold" style={styles.acceptedText}>
          {t('chat.mrzScanned')}
        </Text>
      </View>
    ),
  }

  return (
    <View style={styles.container}>
      <Header theme={theme} title={t('chat.mrzRequest')} leftIconName="scan" />
      <View style={styles.subContainer}>
        <Text typography="EuclidCircularA-Regular" style={styles.instructions}>
          {t('chat.mrzScanInst')}
        </Text>
        <SvgIcon name="MRZ" width={'100%'} height={widthPercentageToDP('43')} style={styles.icon} />
        {footer[props.metadata!.state]}
      </View>
    </View>
  )
}

export default MrzRequestChatView
