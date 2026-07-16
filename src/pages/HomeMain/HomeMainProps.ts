import { StackScreenProps } from '@react-navigation/stack'

import { NavigationStackParams } from '@src/components/Navigation/NavigationProps'

export type HomeTabProps = StackScreenProps<NavigationStackParams, 'Home', 'stack_navigator_main'>

export type HomeMainTabParams = {
  Wallet: undefined
  Scan: undefined
  Chats: undefined
  Settings: undefined
}
