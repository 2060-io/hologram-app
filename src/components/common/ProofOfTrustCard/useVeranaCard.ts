import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { useMemo } from 'react'
import getStyles, { getVeranaCardColors } from './styles'

export const useVeranaCard = () => {
  const theme = useTheme()
  return useMemo(() => {
    const colors = getVeranaCardColors(theme.isDarkMode)
    return { colors, styles: getStyles(colors, theme), isDarkMode: theme.isDarkMode }
  }, [theme])
}
