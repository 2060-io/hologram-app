import React from 'react'
import { View } from 'react-native'

import getStyles from './styles'

import { ConnectionRefusedByAge, SvgIcon } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { widthPercentageToDP } from '@2060/utils/responsiveUtils'

type Props = {
  kidAge: number
  userName: string | undefined
}

const CanNotConnect = ({ kidAge, userName }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const iconWidth = widthPercentageToDP('15')

  return (
    <View style={styles.container}>
      <SvgIcon name="kid" width={iconWidth} height={iconWidth} />
      <ConnectionRefusedByAge style={styles.text} kidAge={kidAge} userName={userName} />
    </View>
  )
}

export default CanNotConnect
