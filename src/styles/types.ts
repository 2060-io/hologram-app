export type AppTheme = {
  colors: AppColors
  fontSize: FontSizeType
  isDarkMode: boolean
  edges: { messageMargin: number }
}

export type FontSizeType = {
  sm: number
  md: number
  md2: number
  lg: number
  xl: number
}

export type Palette = {
  green: string
  lightGrey: string
  darkGrey: string
  black: string
  white: string
  red: string
  orange: string
}

export interface ThemeColors {
  primary: string
  secondary: string
  primaryText: string
  secondaryText: string
  tertiaryText: string
  grey: string
  secondaryGrey: string
  blue: string
}

export interface AppColors extends ThemeColors, Palette {}
