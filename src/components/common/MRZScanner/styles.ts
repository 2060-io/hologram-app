import { StyleSheet } from 'react-native'

import { screenHeight, screenWidth } from '@2060/utils/responsiveUtils'

export default StyleSheet.create({
  fixToText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skipButtonContainer: {
    position: 'absolute',
    bottom: screenHeight * 0.05,
    width: screenWidth,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
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
})
