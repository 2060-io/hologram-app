import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs'
import React from 'react'
import { View, SafeAreaView, Platform } from 'react-native'

import styles from './styles'

type LayoutScreenProps = {
  children: React.ReactElement | React.ReactElement[]
  marginHorizontal?: number
  isRegistered?: boolean
}

const LayoutScreen = ({ children, marginHorizontal = 0 }: LayoutScreenProps) => (
  <BottomTabBarHeightContext.Consumer>
    {(barHeight = 0) => (
      <SafeAreaView style={styles.container}>
        <View
          style={[styles.innerContainer, { marginBottom: Platform.OS === 'ios' ? barHeight - 0 : barHeight }]}
        >
          <View style={[styles.view, { marginHorizontal }]}>{children}</View>
        </View>
      </SafeAreaView>
    )}
  </BottomTabBarHeightContext.Consumer>
)

export default LayoutScreen
