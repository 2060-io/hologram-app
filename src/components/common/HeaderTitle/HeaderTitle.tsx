import React from 'react'

import Text from '../Text'

import { getGlobalStyles, AppTheme } from '@2060/styles'

type Props = {
  title: string
  theme: AppTheme
}

const HeaderTitle = ({ title = '', theme }: Props) => {
  const globalStyles = getGlobalStyles(theme)
  return (
    <Text typography="EuclidCircularA-Medium" style={globalStyles.headerTitleStyle} numberOfLines={1}>
      {title}
    </Text>
  )
}

export default HeaderTitle
