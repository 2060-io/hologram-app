import { AppTheme, getGlobalStyles } from '@src/styles'
import React from 'react'
import Text from '../Text'

type Props = {
  title: string
  theme: AppTheme
}

const HeaderTitle = ({ title = '', theme }: Props) => {
  const globalStyles = getGlobalStyles(theme)
  return (
    <Text fontFamily="EuclidCircularA-Medium" style={globalStyles.headerTitleStyle} numberOfLines={1}>
      {title}
    </Text>
  )
}

export default HeaderTitle
