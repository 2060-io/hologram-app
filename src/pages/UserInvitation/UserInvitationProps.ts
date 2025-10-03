import { UserProfileData } from '@2060.io/credo-ts-didcomm-user-profile'
import { StackScreenProps } from '@react-navigation/stack'

import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'

export type ConnectionInfo = {
  invitationCode: string
  imageUrl?: string
  displayName: string
}

export interface WrapperUserInvitationProps
  extends StackScreenProps<NavigationStackParams, 'UserInvitation'> {}

export interface UserInvitationProps extends StackScreenProps<NavigationStackParams> {
  connectionInfo: ConnectionInfo
  userProfileData?: UserProfileData
  createNewInvitation: () => Promise<void>
}
