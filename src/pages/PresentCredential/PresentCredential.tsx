import { StackScreenProps } from '@react-navigation/stack'
import { ConnectionsSelection } from '@src/components'
import { NavigationStackParams } from '@src/components/Navigation/NavigationProps'
import { usePresentCredential } from '@src/hooks'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

type Props = StackScreenProps<NavigationStackParams, 'PresentCredential'>

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
      headerTitle={t('navigation.PresentCredential')}
    />
  )
}

export default PresentCredential
