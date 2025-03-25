import { Picker } from '@react-native-picker/picker'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, ScrollView } from 'react-native'
import { getCountry } from 'react-native-localize'

import countries from './countries.json'
import getStyles from './styles'

import { CredentialIssuer } from '@2060/components'
import { SvgIcon, Text } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { getFlagEmoji, log } from '@2060/utils'
import { widthPercentageToDP } from '@2060/utils/responsiveUtils'

const IdentityCredentialIssuers = () => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const [selectedCountry, setSelectedCountry] = useState(getCountry())
  const connect = (issuerId: string) => {
    log('connect to', issuerId)
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.subContainer}>
        <SvgIcon name="MRZ" width={'100%'} height={widthPercentageToDP('43')} style={styles.icon} />
        <Text typography="EuclidCircularA-Medium" style={styles.text}>
          {t('credential.issuerInstructions')}
        </Text>
        <Text typography="EuclidCircularA-Medium" style={styles.issuerName}>
          {t('credential.citizenship')}
        </Text>
        <Picker
          style={styles.pickerContainer}
          itemStyle={styles.pickerItem}
          selectedValue={selectedCountry}
          onValueChange={itemValue => setSelectedCountry(itemValue)}
        >
          {countries.map(country => (
            <Picker.Item
              key={country.code}
              label={`${country.name} ${getFlagEmoji(country.code)}`}
              value={country.code}
              style={styles.pickerItem}
            />
          ))}
        </Picker>
        <Text typography="EuclidCircularA-Medium" style={[styles.text, { marginBottom: 10 }]}>
          {t('credential.availableIssuers')}
        </Text>
        <CredentialIssuer connect={connect} />
      </ScrollView>
    </SafeAreaView>
  )
}

export default IdentityCredentialIssuers
