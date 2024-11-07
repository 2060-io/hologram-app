import { StyleSheet } from 'react-native'

import { screenHeight } from '@2060/utils/responsiveUtils'

export default StyleSheet.create({
  fixToText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    position: 'absolute',
    width: 'auto',
    bottom: screenHeight * 0.05,
    backgroundColor: 'transparent',
    paddingHorizontal: 10,
  },
})
