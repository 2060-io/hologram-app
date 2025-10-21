import { ProofState } from '@credo-ts/core'
import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, ScrollView, View } from 'react-native'

import getStyles from './styles'

import { CredentialDetails } from '@2060/components'
import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { Text } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'

interface Props extends StackScreenProps<NavigationStackParams, 'Presentation'> {}

const Presentation = ({ route }: Props) => {
  const { proofState, mainInfo, attributes } = route.params
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.subContainer}>
          {proofState !== ProofState.PresentationReceived && (
            <Text fontFamily="EuclidCircularA-Medium" style={styles.valuesNoRevealedYet}>
              {t('presentationRequest.valuesNoRevealedYet')}
            </Text>
          )}
          <CredentialDetails credentialDetails={{ mainInfo, attributes }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default Presentation
