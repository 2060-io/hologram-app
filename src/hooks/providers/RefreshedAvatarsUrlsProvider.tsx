import React, { createContext, useContext, useState } from 'react'

interface Props {
  children?: React.ReactNode
}

interface RefreshedAvatarsUrlsContextInterface {
  updateRefreshedAvatarsUrlsList(avatarUrl: string): void
  refreshedAvatarsUrlsList: string[]
}

const RefreshedAvatarsUrlsContext = createContext<RefreshedAvatarsUrlsContextInterface | undefined>(undefined)

export const useRefreshedAvatarsUrls = () => {
  const avatarsUrlsContext = useContext(RefreshedAvatarsUrlsContext)
  if (!avatarsUrlsContext) {
    throw new Error('avatarsUrlsContext must be used within a RefreshedAvatarsUrlsContextProvider')
  }

  return avatarsUrlsContext
}

export const RefreshedAvatarsUrlsProvider: React.FC<React.PropsWithChildren<Props>> = ({ children }) => {
  const [refreshedAvatarsUrlsList, setRefreshedAvatarsUrlsRefreshedList] = useState<string[]>([])

  const updateRefreshedAvatarsUrlsList = (avatarUrl: string) => {
    setRefreshedAvatarsUrlsRefreshedList(prevState => [...prevState, avatarUrl])
  }

  return (
    <RefreshedAvatarsUrlsContext.Provider
      value={{
        updateRefreshedAvatarsUrlsList,
        refreshedAvatarsUrlsList,
      }}
    >
      {children}
    </RefreshedAvatarsUrlsContext.Provider>
  )
}
