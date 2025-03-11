import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'

import BaseForward from './BaseForward'

import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { log } from '@2060/utils'

interface Props extends StackScreenProps<NavigationStackParams, 'ForwardConnection'> {}

const ForwardConnection = ({ navigation, route }: Props) => {
  const { connectionId } = route.params
  const forwardConnection = (connectionsId: string[]) => {
    log('sent to', connectionsId)
    navigation.goBack()
  }

  return (
    <BaseForward navigation={navigation} onPressForward={forwardConnection} connectionId={connectionId} />
  )
}

export default ForwardConnection
