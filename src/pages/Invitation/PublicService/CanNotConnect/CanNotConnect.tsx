import React from 'react'
import { View } from 'react-native'

import getStyles from './styles'

import { ConnectionRefusedByAge, SvgIcon } from '@src/components/common'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { widthPercentageToDP } from '@src/utils/responsiveUtils'

type Props = {
  kidAge: number
  userName: string | undefined
}

const CanNotConnect = ({ kidAge, userName }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const iconWidth = widthPercentageToDP('16.5%')

  return (
    <View style={styles.container}>
      <SvgIcon name="kid" width={iconWidth} height={iconWidth} />
      <ConnectionRefusedByAge style={styles.text} kidAge={kidAge} userName={userName} />
    </View>
  )
}

export default CanNotConnect
