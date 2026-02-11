import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { TouchableOpacity, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'

import getStyles from './styles'

import { MainButton, SvgIcon, Text } from '@src/components/common'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { widthPercentageToDP } from '@src/utils/responsiveUtils'

type Props = {
  scan: () => void
  dismissPopup: () => void
  refuse: () => void
}

const EMrtdInstructions = ({ scan, dismissPopup, refuse }: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)

  const refuseAndDismissPopup = () => {
    refuse()
    dismissPopup()
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.subContainer}>
          <View style={styles.flex1}>
            <View style={styles.headerContainer}>
              <TouchableOpacity onPress={dismissPopup}>
                <SvgIcon name="close" width={24} height={24} fill={theme.colors.secondaryGrey} />
              </TouchableOpacity>
              <Text fontFamily="EuclidCircularA-Bold" style={styles.title}>
                {t('chat.eMRTDRequest')}
              </Text>
            </View>
            <Text fontFamily="EuclidCircularA-Bold" style={styles.note}>
              {t('importantNote')}
            </Text>
            <Trans
              i18nKey="chat.eMRTDScanInst"
              style={styles.instructions}
              parent={Text}
              components={{
                green: <Text style={styles.instructionsGreen} />,
              }}
            />
            <View style={styles.imageContainer}>
              <SvgIcon name="NFCGroup" width="73%" height={widthPercentageToDP('64')} />
            </View>
          </View>
          <MainButton text={t('getStarted')} onPress={scan} />
          <TouchableOpacity onPress={refuseAndDismissPopup}>
            <Text fontFamily="EuclidCircularA-Medium" style={styles.refuseText}>
              {t('general.refuse')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

export default EMrtdInstructions
