import { useHeaderHeight } from '@react-navigation/elements'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import BaseConnections from './BaseConnections'

import { ConnectionItem } from '@2060/components/ConnectionsList/ConnectionListProps'
import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'

interface Props extends StackScreenProps<NavigationStackParams, 'Connections'> {}

const Connections = ({ navigation }: Props) => {
  const { t } = useTranslation()
  const headerHeight = useHeaderHeight()

  const goToConnectionDetails = useCallback((connectionItem: ConnectionItem) => {
    navigation.navigate('ConnectionDetails', { connectionId: connectionItem.id })
  }, [])

  return (
    <BaseConnections
      navigation={navigation}
      onPressConnection={goToConnectionDetails}
      headerProps={{ height: headerHeight, title: t('navigation.Connections') }}
    />
  )
}

export default Connections
