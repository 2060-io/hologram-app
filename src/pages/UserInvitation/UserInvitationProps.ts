import { DidCommUserProfileData } from '@2060.io/credo-ts-didcomm-user-profile'
import { StackScreenProps } from '@react-navigation/stack'

import { NavigationStackParams } from '@src/components/Navigation/NavigationProps'

export type Invitation = {
  url: string
  imageUrl?: string
  displayName: string
}

export type WrapperUserInvitationProps = StackScreenProps<NavigationStackParams, 'UserInvitation'>

export interface UserInvitationProps extends StackScreenProps<NavigationStackParams> {
  invitation: Invitation
  userProfileData?: DidCommUserProfileData
  createNewInvitation: () => Promise<void>
}
