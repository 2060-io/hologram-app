/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 FIXME: This file must be reworked: it tries to be generic but actually depends on properties from
 CommunicationPolicy, like id, displayName and label
*/
import { Picker, PickerIOS } from '@react-native-community/picker'
import React, { useState } from 'react'
import { View, Platform, StyleProp, TextStyle } from 'react-native'

import styles from './styles'

import { Text } from '@2060/components/common'
import { primaryColor, grayColor } from '@2060/constants'

interface Props {
  options: any[]
  defaultOptionId?: string | number
  selectOptionLabel?: string
  label?: string
  stylePicker?: StyleProp<TextStyle>
  onOptionSelected?: (option: any) => any
}

const CustomPicker: React.FC<Props> = ({
  options,
  defaultOptionId,
  selectOptionLabel,
  label,
  stylePicker,
  onOptionSelected,
}) => {
  const [selectedValue, setSelectedValue] = useState<string | undefined | number>(defaultOptionId)
  const isIOS = Platform.OS === 'ios'

  const onValueChange = (itemValue: any) => {
    if (itemValue !== -1) {
      const selectedOption = options.find(item => item.id === itemValue)
      onOptionSelected?.(selectedOption)
      setSelectedValue(selectedOption.id)
    } else setSelectedValue(undefined)
  }

  return (
    <View>
      <View style={styles.policyPickerContainer}>
        {label && (
          <Text typography="SFPro-Medium" style={styles.policyPrompt}>
            {label}
          </Text>
        )}

        {isIOS && (
          <PickerIOS
            style={[styles.picker, stylePicker]}
            itemStyle={styles.itemPicker}
            selectedValue={selectedValue || -1}
            onValueChange={onValueChange}
          >
            {selectOptionLabel && (
              <PickerIOS.Item key={-1} label={selectOptionLabel} value={-1} color={grayColor} />
            )}
            {options.map(option => (
              <PickerIOS.Item
                key={option.id}
                label={option?.displayName || option?.label}
                value={option.id}
                color={primaryColor}
              />
            ))}
          </PickerIOS>
        )}
        {!isIOS && (
          <Picker
            style={[styles.picker, stylePicker]}
            mode="dropdown"
            selectedValue={selectedValue || -1}
            onValueChange={onValueChange}
          >
            {selectOptionLabel && (
              <Picker.Item key={-1} label={selectOptionLabel} value={-1} color={grayColor} />
            )}
            {options.map(option => (
              <Picker.Item
                key={option.id}
                label={option?.displayName || option?.label}
                value={option.id}
                color={primaryColor}
              />
            ))}
          </Picker>
        )}
      </View>
    </View>
  )
}

export default CustomPicker
