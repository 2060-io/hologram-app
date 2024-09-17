import { StyleSheet } from 'react-native'

import { widthPercentageToDP } from '@2060/utils/responsiveUtils'

export default StyleSheet.create({
  textMessage: {
    color: 'white',
    textAlign: 'center',
    fontSize: 19,
    lineHeight: 27,
  },
  containerMessage: {
    alignSelf: 'center',
    position: 'absolute',
    padding: 10,
    zIndex: 1,
    elevation: 1,
    borderRadius: 6,
    borderWidth: 2,
    width: widthPercentageToDP('91%'),
  },
  containerContentMessage: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerIconMessage: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginBottom: 10,
    width: 40,
  },
})
