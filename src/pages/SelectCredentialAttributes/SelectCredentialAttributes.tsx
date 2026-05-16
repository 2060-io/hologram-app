import { StackScreenProps } from '@react-navigation/stack'
import { CredentialAttribute } from '@src/components'
import { MainButton, SvgIcon, Text } from '@src/components/common'
import { NavigationStackParams } from '@src/components/Navigation/NavigationProps'
import { useNetwork, usePresentCredential } from '@src/hooks'
import { useCredentials } from '@src/hooks/agent'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { getCredentialAttributes } from '@src/services/agent/display'
import { formatCredentialSubject } from '@src/services/agent/formatCredentialSubject'
import { toast } from '@src/utils/toast'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import getStyles from './styles'

type Props = StackScreenProps<NavigationStackParams, 'SelectCredentialAttributes'>

const SelectCredentialAttributes = ({ navigation, route }: Props) => {
  const { presentDirectly, credentialRecordId, connectionToPresent } = route.params
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { netInfo } = useNetwork()
  const { present } = usePresentCredential()
  const { getCredentialById } = useCredentials()
  const credentialRecord = getCredentialById(credentialRecordId)
  const [attributesToPresent, setAttributesToPresent] = useState<string[]>([])
  const [areAllSelected, setAreAllSelected] = useState(false)
  const credentialAttributes = credentialRecord ? getCredentialAttributes(credentialRecord) : undefined
  const attributesSections = credentialAttributes ? formatCredentialSubject({ subject: credentialAttributes }) : []
  const allAttributes = useMemo(() => {
    return attributesSections.flatMap((section) => section.rows.map(({ key }) => key))
  }, [attributesSections])

  const updateSelectedAttributes = useCallback((attributeKey: string) => {
    setAttributesToPresent((prevState) => {
      if (prevState.includes(attributeKey)) {
        return prevState.filter((selectedAttribute) => selectedAttribute !== attributeKey)
      } else {
        return [...prevState, attributeKey]
      }
    })
  }, [])

  const handleSelectAll = () => {
    const newAreAllSelected = !areAllSelected
    if (newAreAllSelected) {
      setAttributesToPresent(allAttributes)
    } else {
      setAttributesToPresent([])
    }
    setAreAllSelected(newAreAllSelected)
  }

  const onPresent = () => {
    if (presentDirectly && connectionToPresent) {
      present(credentialRecordId, [connectionToPresent], attributesToPresent, navigation)
    } else {
      navigation.navigate('PresentCredential', { credentialRecordId, attributesToPresent })
    }
  }

  const generateQR = useCallback(() => {
    if (!netInfo.isConnected) {
      toast({ type: 'error', message: t('call.youNeedInternetConnection') })
      return
    }
    navigation.navigate('PresentCredentialAsQR', { credentialRecordId, attributesToPresent })
  }, [attributesToPresent, netInfo])

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
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
                        <CredentialAttribute
                          key={attribute.key}
                          attribute={attribute}
                          onPress={updateSelectedAttributes}
                          style={[
                            styles.credentialAttributeContainer,
                            isSelected && styles.selectedCredentialAttribute,
                          ]}
                          rightContent={isSelected ? <SvgIcon name="done" fill={theme.colors.green} /> : null}
                        />
                      )
                    }}
                  />
                </View>
              )
            }}
          />
          {!presentDirectly && (
            <MainButton
              disabled={!attributesToPresent.length}
              text={t('credential.createQRCode')}
              onPress={generateQR}
              style={[
                styles.generateQRButton,
                attributesToPresent.length ? styles.presentEnabled : styles.presentDisabled,
              ]}
              iconName="qrcode"
            />
          )}
          <MainButton
            disabled={!attributesToPresent.length}
            text={presentDirectly ? t('general.present') : t('credential.presentToConnection')}
            onPress={onPresent}
            style={[attributesToPresent.length ? styles.presentEnabled : styles.presentDisabled]}
            iconName={presentDirectly ? undefined : 'users'}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default SelectCredentialAttributes
