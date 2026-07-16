import { DidCommUserProfileData, GetUserProfileDataReturnType } from '@2060.io/credo-ts-didcomm-user-profile'
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

import { useMobileAgent } from './MobileAgentProvider'

interface UserProfileContextInterface {
  userProfileData?: GetUserProfileDataReturnType
  updateUserProfileData: (data: DidCommUserProfileData) => void
}

const UserProfileContext = createContext<UserProfileContextInterface | undefined>(undefined)

export const useUserProfile = () => {
  const context = useContext(UserProfileContext)
  if (!context) throw new Error('useUserProfile must be used within a UserProfileContextProvider')

  return context
}

interface Props {
  children?: React.ReactNode
}

export const UserProfileProvider: React.FC<Props> = ({ children }) => {
  const { isInitialized, agent } = useMobileAgent()
  const [userProfileState, setUserProfileState] = useState<{
    userProfileData?: GetUserProfileDataReturnType
  }>()

  useEffect(() => {
    const setInitialState = async () => {
      if (agent && isInitialized) {
        const userProfileData = await agent.modules.profile.getUserProfileData()
        setUserProfileState({ userProfileData })
      }
    }
    setInitialState()
  }, [agent, isInitialized])

  const updateUserProfileData = useCallback(
    async (data: Partial<DidCommUserProfileData>) => {
      const userProfileData = await agent?.modules.profile.updateUserProfileData(data)
      setUserProfileState({ userProfileData })
    },
    [agent]
  )

  return <UserProfileContext value={{ ...userProfileState, updateUserProfileData }}>{children}</UserProfileContext>
}
