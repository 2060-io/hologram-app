import { UserProfileData } from '@2060.io/credo-ts-didcomm-user-profile'
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react'

import { useMobileAgent } from './MobileAgentProvider'

import { log } from '@2060/utils'

interface UserProfileContextInterface {
  userProfileData?: UserProfileData
  updateUserProfileData: (data: UserProfileData) => void
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
  const [userProfileState, setUserProfileState] = useState<{ userProfileData?: UserProfileData }>()

  useEffect(() => {
    const setInitialState = async () => {
      if (agent && isInitialized) {
        const userProfileData = await agent.modules.profile.getUserProfileData()
        log('userProfileData', userProfileData)
        setUserProfileState({ userProfileData })
      }
    }
    setInitialState()
  }, [agent, isInitialized])

  const updateUserProfileData = useCallback(
    async (data: Partial<UserProfileData>) => {
      log('daniel guardo', data)
      const userProfileData = await agent?.modules.profile.updateUserProfileData({
        ...data,
        updatedAt: new Date(),
      })
      setUserProfileState({ userProfileData })
    },
    [agent],
  )

  return (
    <UserProfileContext value={{ ...userProfileState, updateUserProfileData }}>{children}</UserProfileContext>
  )
}
