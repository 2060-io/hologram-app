import { UserProfileData } from '@2060.io/credo-ts-didcomm-user-profile'
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react'

import { useMobileAgent } from './MobileAgentProvider'

interface UserProfileContextInterface {
  loading: boolean
  userProfileData?: UserProfileData
  setUserProfileData?: (data: Partial<UserProfileData>) => unknown
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

  const [userProfileState, setUserProfileState] = useState<UserProfileContextInterface>({
    loading: true,
  })

  const setUserProfileDataInternal = useCallback(
    async (data: Partial<UserProfileData>) => {
      if (agent && agent.isInitialized) {
        const newUserProfileData = await agent?.modules.profile.updateUserProfileData(data)
        setUserProfileState(prevState => ({ ...prevState, userProfileData: newUserProfileData }))
      }
    },
    [userProfileState],
  )

  const setInitialState = async () => {
    if (agent && isInitialized) {
      const profileData = await agent.modules.profile.getUserProfileData()
      setUserProfileState({
        loading: false,
        userProfileData: profileData,
        setUserProfileData: setUserProfileDataInternal,
      })
    } else {
      setUserProfileState({ loading: true })
    }
  }

  useEffect(() => {
    setInitialState()
  }, [agent, isInitialized])

  return <UserProfileContext value={userProfileState}>{children}</UserProfileContext>
}
