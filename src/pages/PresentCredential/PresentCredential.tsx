import { StackScreenProps } from '@react-navigation/stack'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { ConnectionsSelection } from '@2060/components'
import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { usePresentCredential } from '@2060/hooks'

interface Props extends StackScreenProps<NavigationStackParams, 'PresentCredential'> {}

const PresentCredential = ({ navigation, route }: Props) => {
  const { credentialRecordId, attributesToPresent } = route.params
  const { t } = useTranslation()
  const { present } = usePresentCredential()

  const presentCredential = useCallback((connectionsId: string[]) => {
    present(credentialRecordId, connectionsId, attributesToPresent, navigation)
  }, [])

  return (
    <ConnectionsSelection
      navigation={navigation}
      onPressSend={presentCredential}
      title={t('navigation.PresentCredential')}
    />
  )
}

export default PresentCredential
