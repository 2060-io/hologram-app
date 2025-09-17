import { getApp } from '@react-native-firebase/app'
import { getToken } from '@react-native-firebase/app-check'

export const getAppCheckHeaders = async () => ({
  'X-Firebase-AppCheck': (await getToken(getApp().appCheck())).token,
})
