import { StackScreenProps } from '@react-navigation/stack'
import { UserProfileData } from 'credo-ts-user-profile'

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
}
