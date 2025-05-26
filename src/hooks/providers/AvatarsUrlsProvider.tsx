import React, { createContext, useContext, useState } from 'react'

interface Props {
  children?: React.ReactNode
}

export interface AvatarsUrlsContextInterface {
  updateAvatarsUrlsRefreshedList(avatarUrl: string): void
  avatarsUrlsRefreshedList: string[]
}

const AvatarsUrlsContext = createContext<AvatarsUrlsContextInterface | undefined>(undefined)

export const useAvatarsUrls = () => {
  const avatarsUrlsContext = useContext(AvatarsUrlsContext)
  if (!avatarsUrlsContext) {
    throw new Error('avatarsUrlsContext must be used within a AvatarsUrlsContextProvider')
  }

  return avatarsUrlsContext
}

export const AvatarsUrlsProvider: React.FC<React.PropsWithChildren<Props>> = ({ children }) => {
  const [avatarsUrlsRefreshedList, setAvatarsUrlsRefreshedList] = useState<string[]>([])

  const updateAvatarsUrlsRefreshedList = (avatarUrl: string) => {
    setAvatarsUrlsRefreshedList(prevState => [...prevState, avatarUrl])
  }

  return (
    <AvatarsUrlsContext.Provider
      value={{
        updateAvatarsUrlsRefreshedList,
        avatarsUrlsRefreshedList,
      }}
    >
      {children}
    </AvatarsUrlsContext.Provider>
  )
}
