import { ParamListBase } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, View, FlatList, TouchableOpacity, SafeAreaView } from 'react-native'

import CredentialAttribute from '../CredentialAttribute'

import getStyles from './styles'

import { Text, Modal, MainButton, SvgIcon } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { CredentialAttributeTable } from '@2060/services/agent/formatCredentialSubject'

type Props = {
  visible: boolean
  attributesSections: CredentialAttributeTable[]
  onRequestClose: () => void
  onPresent: (attributesToPresent: string[]) => void
  navigate: StackNavigationProp<ParamListBase>['navigate']
  credentialRecordId: string
}

const SelectCredentialAttributes = ({
  visible,
  attributesSections,
  onRequestClose,
  onPresent,
  navigate,
  credentialRecordId,
}: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const [attributesToPresent, setAttributesToPresent] = useState<string[]>([])
  const [areSelectedAll, setAreAllSelected] = useState(false)
  const allAttributes = useMemo(() => {
    return attributesSections.map(section => section.rows.map(({ key }) => key)).flat()
  }, [attributesSections])

  const close = () => {
    cleanStateVars()
    onRequestClose()
  }

  const cleanStateVars = () => {
    setAttributesToPresent([])
    setAreAllSelected(false)
  }
  const updateSelectedAttributesToPresent = (attributeKey: string) => {
    setAttributesToPresent(prevState => {
      if (prevState.includes(attributeKey)) {
        return prevState.filter(selectedAttribute => selectedAttribute !== attributeKey)
      } else {
        return [...prevState, attributeKey]
      }
    })
  }

  const handleSelectAll = () => {
    const newAreAllSelected = !areSelectedAll
    newAreAllSelected ? setAttributesToPresent(allAttributes) : setAttributesToPresent([])
    setAreAllSelected(newAreAllSelected)
  }

  const generateQR = useCallback(() => {
    navigate('PresentCredentialAsQR', { credentialRecordId, attributesToPresent })
  }, [attributesToPresent])

  return (
    <Modal visible={visible} statusBarTranslucent={false} onRequestClose={close} animationType="slide">
      <SafeAreaView style={styles.container}>
        <TouchableOpacity activeOpacity={1} style={styles.cancelContainer} onPress={close}>
          <Text style={styles.cancelText} fontFamily="EuclidCircularA-Medium">
            {t('general.cancel')}
          </Text>
          <SvgIcon name="close" width={28} height={28} fill={theme.colors.primaryText} />
        </TouchableOpacity>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.subContainer}>
            <Text style={styles.title}>{t('credential.selectAttributes')}</Text>
            <Text style={styles.selectAllText} onPress={handleSelectAll}>
              {areSelectedAll ? t('credential.unselectAll') : t('credential.selectAll')}
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
                            style={[
                              styles.credentialAttributeContainer,
                              isSelected && styles.selectedCredentialAttribute,
                            ]}
                            onPress={updateSelectedAttributesToPresent}
                          />
                        )
                      }}
                    />
                  </View>
                )
              }}
            />
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
            <MainButton
              disabled={!attributesToPresent.length}
              text={t('credential.presentToConnection')}
              onPress={() => onPresent(attributesToPresent)}
              style={[attributesToPresent.length ? styles.presentEnabled : styles.presentDisabled]}
              iconName="users"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  )
}

export default SelectCredentialAttributes
