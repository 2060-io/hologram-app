import React from 'react'
import { StyleSheet, View } from 'react-native'
import Svg, { Path, SvgProps } from 'react-native-svg'

const Link: React.FC<SvgProps> = (props) => (
  <View style={styles.container}>
    <Svg viewBox="0 0 17.444 8.722" {...props}>
      <Path
        data-name="Trazado 789"
        d="M13.083 0h-2.617a.872.872 0 000 1.744h2.617a2.617 2.617 0 110 5.233h-2.617a.872.872 0 100 1.744h2.617a4.361 4.361 0 100-8.722zm-7.85 4.361a.875.875 0 00.872.872h5.233a.872.872 0 000-1.744H6.105a.875.875 0 00-.872.872zm1.745 2.617H4.361a2.617 2.617 0 010-5.233h2.617a.872.872 0 000-1.745H4.361a4.361 4.361 0 100 8.722h2.617a.872.872 0 100-1.744z"
        fill={props.fill}
      />
    </Svg>
  </View>
)

const styles = StyleSheet.create({
  container: {
    transform: [{ rotate: '325deg' }],
  },
})

export default Link
