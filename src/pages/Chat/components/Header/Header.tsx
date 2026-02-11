import React from 'react'
import { StyleSheet, View } from 'react-native'

import { SvgIcon, Text } from '@src/components/common'
import { IconsNames } from '@src/components/common/SvgIcon'
import { ChatEntryRole } from '@src/model'
import { AppTheme } from '@src/styles'

type Props = {
  theme: AppTheme
  title: string
  leftIconName: keyof IconsNames
  rightIcon?: React.ReactNode
  role?: ChatEntryRole
}

const Header = ({ theme, title, leftIconName, role = ChatEntryRole.Receiver, rightIcon }: Props) => {
  const styles = getStyles(theme, role)
  return (
    <View style={styles.headerContainer}>
      <SvgIcon name={leftIconName} fill={theme.colors.blue} width={22} height={22} />
      <Text fontFamily="EuclidCircularA-Bold" style={styles.headerTitle} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.rightIconContainer}>{rightIcon}</View>
    </View>
  )
}

const getStyles = (theme: AppTheme, role: ChatEntryRole) =>
  StyleSheet.create({
    headerContainer: {
      flexDirection: 'row',
      padding: theme.edges.messageMargin,
      backgroundColor:
        role === ChatEntryRole.Receiver
          ? theme.isDarkMode
            ? theme.colors.grey
            : '#CDD4D7'
          : theme.isDarkMode
            ? theme.colors.darkGrey
            : theme.colors.lightGrey,
      alignItems: 'center',
    },
    headerTitle: {
      marginHorizontal: theme.edges.messageMargin,
      color: theme.colors.blue,
      fontSize: theme.fontSize.md2,
    },
    rightIconContainer: {
      flex: 1,
      alignItems: 'flex-end',
    },
  })

export default Header
