import { ParamListBase } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { View, TouchableOpacity } from 'react-native'

import getStyles from './styles'

import { Text, SvgIcon } from '@src/components/common'
import { useTheme } from '@src/hooks/providers/ThemeProvider'

interface Props {
  navigation: StackNavigationProp<ParamListBase>
  stopSelectingMessagesMode(): void
}

const SelectingMessagesHeader: React.FC<Props> = ({ navigation, stopSelectingMessagesMode }) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { primaryText } = theme.colors

  const goBack = () => navigation.goBack()

  return (
    <View style={[styles.container]}>
      <View style={styles.subContainer}>
        <TouchableOpacity activeOpacity={0.4} onPress={goBack}>
          <SvgIcon name="arrowBack" width={28} height={28} fill={primaryText} />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.4} style={styles.rowContainer} onPress={stopSelectingMessagesMode}>
          <Text style={[styles.headerBtnText, styles.cancelText]} fontFamily="EuclidCircularA-Medium">
            {t('general.cancel')}
          </Text>
          <SvgIcon name="close" width={28} height={28} fill={primaryText} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default SelectingMessagesHeader
