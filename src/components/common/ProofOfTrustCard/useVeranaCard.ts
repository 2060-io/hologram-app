import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { useMemo } from 'react'
import getStyles, { getVeranaCardColors } from './styles'

export const useVeranaCard = () => {
  const { isDarkMode } = useTheme()
  return useMemo(() => {
    const colors = getVeranaCardColors(isDarkMode)
    return { colors, styles: getStyles(colors), isDarkMode }
  }, [isDarkMode])
}
