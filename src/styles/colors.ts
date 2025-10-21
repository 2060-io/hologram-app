import { ThemeColors, AppColors } from './types'

const lightColors: ThemeColors = {
  primary: '#FFFFFF',
  secondary: '#F5F7F8',
  primaryText: '#18182F',
  secondaryText: '#787878',
  tertiaryText: '#182022',
  grey: '#EAECEC',
  secondaryGrey: '#9CB1B7',
  blue: '#052B38',
}

const darkColors: ThemeColors = {
  primary: '#232627',
  secondary: '#020F13',
  primaryText: '#FBFBFB',
  secondaryText: '#AFAFAF',
  tertiaryText: '#F5F7F8',
  grey: '#35393B',
  secondaryGrey: '#91979A',
  blue: '#E5E9EA',
}

export const palette = {
  green: '#3EBDB6',
  lightGrey: '#CADDE2',
  darkGrey: '#536B74',
  black: '#000000',
  white: '#FFFFFF',
  red: '#F90F33',
  orange: '#FF9C00',
}

export const getThemeColors = (isDarkMode: boolean) => {
  const themeColors = isDarkMode ? darkColors : lightColors
  const colors: AppColors = {
    ...palette,
    ...themeColors,
  }
  return colors
}
