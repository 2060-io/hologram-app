import { StackScreenProps } from '@react-navigation/stack'

import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'

export interface HomeTabProps
  extends StackScreenProps<NavigationStackParams, 'Home', 'stack_navigator_main'> {}

export type HomeMainTabParams = {
  Wallet: undefined
  Scan: undefined
  Chats: undefined
  Settings: undefined
}
