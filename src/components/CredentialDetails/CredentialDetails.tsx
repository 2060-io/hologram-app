import React from 'react'
import { View } from 'react-native'

import CredentialAttributes from '../CredentialAttributes'

import styles from './styles'

import { CredentialMainInformation } from '@2060/components/common'
import { CredentialDetailsForDisplay } from '@2060/services/agent/display'

type Props = {
  credentialDetails: CredentialDetailsForDisplay
  middleInfo?: React.JSX.Element
}

const CredentialDetails = ({ credentialDetails, middleInfo }: Props) => {
  return (
    <View style={styles.container}>
      <CredentialMainInformation
        credentialMainInfo={credentialDetails.mainInfo}
        containerStyle={styles.credentialMainInfoContainer}
      />
      {middleInfo}
      <CredentialAttributes attributes={credentialDetails.attributes} />
    </View>
  )
}

export default CredentialDetails
