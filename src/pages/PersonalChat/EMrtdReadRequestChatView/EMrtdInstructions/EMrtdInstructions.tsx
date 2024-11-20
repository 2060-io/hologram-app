import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { SafeAreaView, TouchableOpacity, View } from 'react-native'

import getStyles from './styles'

import { MainButton, SvgIcon, Text } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { widthPercentageToDP } from '@2060/utils/responsiveUtils'

type Props = {
  scan: () => void
  dismissPopup: () => void
}

const EMrtdInstructions = ({ scan, dismissPopup }: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)

  const startToScan = () => {
    dismissPopup()
    scan()
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.subContainer}>
        <View style={styles.flex1}>
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={dismissPopup}>
              <SvgIcon name="close" width={24} height={24} fill={theme.colors.secondaryGrey} />
            </TouchableOpacity>
            <Text typography="EuclidCircularA-Bold" style={styles.title}>
              {t('chat.eMRTDRequest')}
            </Text>
          </View>
          <Text typography="EuclidCircularA-Bold" style={styles.note}>
            {t('importantNote')}
          </Text>
          <Trans
            i18nKey={t('chat.eMRTDScanInst')}
            typography="EuclidCircularA-Regular"
            style={styles.instructions}
            parent={Text}
            components={{
              green: <Text typography="EuclidCircularA-Regular" style={styles.instructionsGreen} />,
            }}
          />
          <View style={styles.imageContainer}>
            <SvgIcon name="NFCGroup" width="73%" height={widthPercentageToDP('64')} />
          </View>
        </View>
        <MainButton text={t('getStarted')} onPress={startToScan} />
        <TouchableOpacity onPress={dismissPopup}>
          <Text typography="EuclidCircularA-Medium" style={styles.refuseText}>
            {t('general.refuse')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

export default EMrtdInstructions
