import React, { Component } from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import Feather from 'react-native-vector-icons/Feather'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import Ionicons from 'react-native-vector-icons/Ionicons'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'

type Props = {
  as: 'Ionicons' | 'MaterialIcons' | 'MaterialCommunityIcons' | 'FontAwesome' | 'Feather'
  size: number
  name: string
  color: string
  style?: StyleProp<ViewStyle>
}

class Icon extends Component<Props> {
  render(): React.ReactNode {
    const { as } = this.props
    const templateIcons = {
      ['Ionicons']: Ionicons,
      ['MaterialIcons']: MaterialIcons,
      ['MaterialCommunityIcons']: MaterialCommunityIcons,
      ['FontAwesome']: FontAwesome,
      ['Feather']: Feather,
    }
    const IconComponent = templateIcons[as]
    return <IconComponent {...this.props} />
  }
}

export default Icon
