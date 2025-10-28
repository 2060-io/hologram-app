import { StackScreenProps } from '@react-navigation/stack'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, View, FlatList, TouchableOpacity, SafeAreaView } from 'react-native'

import getStyles from './styles'

import { CredentialAttribute } from '@2060/components'
import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { Text, MainButton, RadioButton, SvgIcon } from '@2060/components/common'
import { usePresentCredential } from '@2060/hooks'
import { useCredentials } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { getCredentialAttributes } from '@2060/services/agent/display'
import { formatCredentialSubject } from '@2060/services/agent/formatCredentialSubject'

interface Props extends StackScreenProps<NavigationStackParams, 'SelectCredentialAttributes'> {}

const SelectCredentialAttributes = ({ navigation, route }: Props) => {
  const { presentDirectly, credentialRecordId, connectionToPresent } = route.params
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { present } = usePresentCredential()
  const { getCredentialById } = useCredentials()
  const credentialRecord = getCredentialById(credentialRecordId)
  const [attributesToPresent, setAttributesToPresent] = useState<string[]>([])
  const [areAllSelected, setAreAllSelected] = useState(false)
  const credentialAttributes = credentialRecord ? getCredentialAttributes(credentialRecord) : undefined
  const attributesSections = credentialAttributes
    ? formatCredentialSubject({ subject: credentialAttributes })
    : []
  const allAttributes = useMemo(() => {
    return attributesSections.map(section => section.rows.map(({ key }) => key)).flat()
  }, [attributesSections])

  const updateSelectedAttributes = useCallback((attributeKey: string) => {
    setAttributesToPresent(prevState => {
      if (prevState.includes(attributeKey)) {
        return prevState.filter(selectedAttribute => selectedAttribute !== attributeKey)
      } else {
        return [...prevState, attributeKey]
      }
    })
  }, [])

  const handleSelectAll = () => {
    const newAreAllSelected = !areAllSelected
    newAreAllSelected ? setAttributesToPresent(allAttributes) : setAttributesToPresent([])
    setAreAllSelected(newAreAllSelected)
  }

  const onPresent = () => {
    if (presentDirectly && connectionToPresent) {
      present(credentialRecordId, [connectionToPresent], attributesToPresent, navigation)
    } else {
      navigation.navigate('PresentCredential', { credentialRecordId, attributesToPresent })
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.subContainer}>
          <Text style={styles.title}>{t('credential.selectAttributes')}</Text>
          <Text style={styles.selectAllText} onPress={handleSelectAll}>
            {areAllSelected ? t('credential.unselectAll') : t('credential.selectAll')}
          </Text>
          <FlatList
            data={attributesSections}
            renderItem={({ item: section, index }) => {
              return (
                <View key={`${section.title}-${index}`}>
                  <Text style={styles.attributesSectionTitle} fontFamily="EuclidCircularA-SemiBold">
                    {section.title ?? t('credentialOffer.claims')}
                  </Text>
                  <FlatList
                    data={section.rows}
                    renderItem={({ item: attribute }) => {
                      const isSelected = attributesToPresent.includes(attribute.key)
                      return (
                        <TouchableOpacity
                          style={styles.attributeContainer}
                          onPress={() => updateSelectedAttributes(attribute.key)}
                        >
                          <CredentialAttribute
                            key={attribute.key}
                            attribute={attribute}
                            style={styles.attributeSubContainer}
                            rightContent={
                              isSelected ? <SvgIcon name="done" fill={theme.colors.green} /> : null
                            }
                          />
                        </TouchableOpacity>
                      )
                    }}
                  />
                </View>
              )
            }}
          />
          <MainButton
            disabled={!attributesToPresent.length}
            text={t('credential.present')}
            onPress={onPresent}
            style={[
              styles.presentButton,
              attributesToPresent.length ? styles.presentEnabled : styles.presentDisabled,
            ]}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default SelectCredentialAttributes
