import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'
import { SafeAreaView, ScrollView, View } from 'react-native'

import styles from './styles'

import { CredentialDetails } from '@2060/components'
import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'

interface Props extends StackScreenProps<NavigationStackParams, 'Presentation'> {}

const Presentation = ({ route }: Props) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.subContainer}>
          <CredentialDetails credentialDetails={{ ...route.params }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default Presentation
