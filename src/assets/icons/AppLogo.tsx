import React from 'react'
import { ViewStyle, View, Image, StyleSheet } from 'react-native'

import { appName } from '../../../app.json'

import smallAppIcon from '@2060/assets/images/smallAppIcon.png'
import { Text } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { AppTheme } from '@2060/styles'
import { widthPercentageToDP } from '@2060/utils/responsiveUtils'

const AppLogo = ({ style }: { style?: ViewStyle }) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  return (
    <View style={[styles.container, style]}>
      <Image source={{ uri: Image.resolveAssetSource(smallAppIcon).uri }} style={styles.icon} />
      <Text style={styles.text} fontFamily="EuclidCircularA-Bold">
        {appName}
      </Text>
    </View>
  )
}

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    icon: {
      width: widthPercentageToDP('11'),
      height: widthPercentageToDP('11'),
      borderRadius: 6,
    },
    text: {
      marginLeft: 6,
      color: theme.colors.primaryText,
      fontSize: 28,
    },
  })
export default AppLogo
