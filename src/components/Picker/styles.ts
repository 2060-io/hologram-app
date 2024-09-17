import { StyleSheet } from 'react-native'

import { primaryColor, grayColor } from '@2060/constants'

export default StyleSheet.create({
  policyPrompt: {
    fontSize: 16,
    color: primaryColor,
  },
  policyPickerContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  picker: {
    width: 190,
    color: grayColor,
  },
  itemPicker: {
    color: primaryColor,
    height: 60,
    fontSize: 15,
  },
})
