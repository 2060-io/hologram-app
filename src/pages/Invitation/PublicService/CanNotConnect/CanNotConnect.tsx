import React from 'react'
import { Trans } from 'react-i18next'
import { View } from 'react-native'

import getStyles from './styles'

import { SvgIcon, Text } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { widthPercentageToDP } from '@2060/utils/responsiveUtils'

const CanNotConnect = ({ kidAge }: { kidAge: number }) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const iconWidth = widthPercentageToDP('15')

  return (
    <View style={styles.container}>
      <SvgIcon name="kid" width={iconWidth} height={iconWidth} />
      <Trans
        i18nKey="invitation.canNotConnect"
        typography="EuclidCircularA-Regular"
        style={styles.text}
        parent={Text}
        components={{
          bold: <Text typography="EuclidCircularA-Bold" style={styles.text} />,
        }}
        values={{ age: kidAge }}
      />
    </View>
  )
}

export default CanNotConnect
