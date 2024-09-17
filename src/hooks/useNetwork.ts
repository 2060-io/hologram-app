import { useNetInfo, NetInfoStateType } from '@react-native-community/netinfo'

export const useNetwork = () => {
  const netInfo = useNetInfo()

  const silentAssertConnectedNetwork = () => {
    return netInfo.isConnected || netInfo.type !== NetInfoStateType.none
  }

  const assertConnectedNetwork = () => {
    const isConnected = silentAssertConnectedNetwork()

    return isConnected
  }

  return {
    netInfo,
    silentAssertConnectedNetwork,
    assertConnectedNetwork,
  }
}
