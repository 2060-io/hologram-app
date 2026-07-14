import { getStateFromPath } from '@react-navigation/native'
import Config from 'react-native-config'

// Per-environment schemes are registered natively (iOS Info-*.plist, Android build.gradle
// manifestPlaceholders). A build only ever receives the scheme it registered, so listing all
// of them here is inert for the others and avoids needing a runtime flavor signal.
export default {
  prefixes: [
    'didcomm://',
    'hologram-zone://',
    'hologram-zone-staging://',
    'hologram-zone-dev://',
    Config.BASE_INVITATION_URL as string,
  ],
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
