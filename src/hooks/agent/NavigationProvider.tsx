import React, { createContext, useContext, useState } from 'react'

interface Props {
  children?: React.ReactNode
}

interface NavigationState {
  localAuth: boolean
}

interface NavigationContextInterface {
  setLocalAuth(localAuth: boolean): void
  getLocalAuth(): boolean
}

const NavigationContext = createContext<NavigationContextInterface | undefined>(undefined)

export const useNavigation = () => {
  const navigationContext = useContext(NavigationContext)
  if (!navigationContext) {
    throw new Error('useNavigation must be used within a NavigationContextProvider')
  }

  return navigationContext
}

export const NavigationProvider: React.FC<React.PropsWithChildren<Props>> = ({ children }) => {
  const [state, setState] = useState<NavigationState>({
    localAuth: false,
  })

  const setLocalAuth = (localAuth: boolean) => {
    setState(prevState => ({ ...prevState, localAuth }))
  }

  const getLocalAuth = () => state.localAuth

  return (
    <NavigationContext
      value={{
        setLocalAuth,
        getLocalAuth,
      }}
    >
      {children}
    </NavigationContext>
  )
}
