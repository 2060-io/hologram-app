import React, { useContext, useMemo, createContext, PropsWithChildren } from 'react'
import { useColorScheme } from 'react-native'

import { fontSizesForMediumPhones, getThemeColors, AppTheme } from '@src/styles'

const themeContextInitialValues = {
  isDarkMode: false,
  colors: getThemeColors(false),
  fontSize: fontSizesForMediumPhones,
  edges: { messageMargin: 8 },
}

export const useTheme = () => {
  const themeContext = useContext(ThemeContext)
  if (!themeContext) throw new Error('useTheme must be used within a ThemeContextProvider')
  return themeContext
}

const ThemeContext = createContext(themeContextInitialValues)

export const ThemeProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const isDarkMode = useColorScheme() === 'dark'

  const theme: AppTheme = useMemo(() => {
    const colors = getThemeColors(isDarkMode)
    return {
      colors,
      fontSize: fontSizesForMediumPhones,
      isDarkMode,
      edges: themeContextInitialValues.edges,
    }
  }, [isDarkMode])

  return <ThemeContext value={theme}>{children}</ThemeContext>
}
