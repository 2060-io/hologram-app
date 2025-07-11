import { getStateFromPath } from '@react-navigation/native'
import Config from 'react-native-config'

export default {
  prefixes: ['didcomm://', Config.BASE_INVITATION_URL as string],
  config: {
    screens: {
      Home: '',
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getStateFromPath: (path: string, options: any) => {
    //split the array by "?" to send only query params to navigation state
    const [_, queryParams] = path.split('?')
    return getStateFromPath(`?${queryParams}`, options)
  },
}
