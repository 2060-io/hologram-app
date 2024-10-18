import { StyleSheet } from 'react-native'

import { screenHeight, screenWidth } from '@2060/utils/responsiveUtils'

export default StyleSheet.create({
  fixToText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  feedbackContainer: {
    position: 'absolute',
    top: screenHeight * 0.3,
    width: screenWidth,
    alignItems: 'center',
  },
  feedbackText: {
    backgroundColor: 'white',
    color: 'black',
    fontSize: 18,
    paddingRight: 8,
    paddingLeft: 8,
    textAlign: 'center',
  },
  cancelButton: {
    position: 'absolute',
    width: 'auto',
    bottom: screenHeight * 0.05,
    backgroundColor: 'transparent',
    paddingHorizontal: 10,
  },
})
