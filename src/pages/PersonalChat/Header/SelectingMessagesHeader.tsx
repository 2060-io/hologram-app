import { ParamListBase } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { View, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import getStyles from './styles'

import { Text, SvgIcon } from '@2060/components/common'
import { IS_DEVICE_IOS } from '@2060/constants'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'

interface Props {
  navigation: StackNavigationProp<ParamListBase>
  stopSelectingMessagesMode(): void
}

const SelectingMessagesHeader: React.FC<Props> = ({ navigation, stopSelectingMessagesMode }) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const insets = useSafeAreaInsets()
  const headerStatusBarHeight = insets.top
  const { primaryText } = theme.colors

  const goBack = () => navigation.goBack()

  return (
    <View style={[styles.container, !IS_DEVICE_IOS && { marginTop: headerStatusBarHeight }]}>
      {IS_DEVICE_IOS && <View style={{ height: headerStatusBarHeight }} />}
      <View style={styles.subContainer}>
        <TouchableOpacity activeOpacity={0.4} onPress={goBack}>
          <SvgIcon name="arrowBack" width={28} height={28} fill={primaryText} />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.4} style={styles.rowContainer} onPress={stopSelectingMessagesMode}>
          <Text style={[styles.headerBtnText, styles.cancelText]} typography="EuclidCircularA-Medium">
            {t('general.cancel')}
          </Text>
          <SvgIcon name="close" width={28} height={28} fill={primaryText} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default SelectingMessagesHeader
