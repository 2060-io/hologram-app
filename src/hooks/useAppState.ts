import { useState, useEffect } from 'react'
import { AppState, AppStateStatus } from 'react-native'

export const useAppState = () => {
  const [isAppActive, setIsAppActive] = useState(true)

  useEffect(() => {
    const onChange = (state: AppStateStatus): void => {
      setIsAppActive(state === 'active')
    }
    const listener = AppState.addEventListener('change', onChange)
    return () => listener.remove()
  }, [])

  return { isAppActive }
}
