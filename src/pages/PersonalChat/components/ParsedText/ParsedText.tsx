import React from 'react'
import { Linking, StyleSheet, TextProps } from 'react-native'

import { Text } from '@2060/components/common'
import { AppTheme } from '@2060/styles'
import { log } from '@2060/utils'

type ParsedTextProps = {
  theme: AppTheme
  text: string
  textProps?: TextProps
}

const ParsedText: React.FC<ParsedTextProps> = ({ theme, text, textProps }) => {
  const styles = getStyles(theme)

  const onUrlPress = (url: string) => {
    if (/^www\./i.test(url)) {
      onUrlPress(`https://${url}`)
    } else {
      Linking.openURL(url).catch(() => log('No handler for URL:', url))
    }
  }
  const textIncludesHttp = text?.includes('http')

  return (
    <Text style={styles.textStyle} {...textProps}>
      {textIncludesHttp
        ? text?.split?.(' ')?.map(value => {
            if (value.startsWith('http')) {
              const isSecureUrl = value.startsWith('https')
              return (
                <Text
                  style={[
                    styles.textStyle,
                    styles.link,
                    { color: isSecureUrl ? theme.colors.green : theme.colors.orange },
                  ]}
                  onPress={() => onUrlPress(value)}
                  key={value}
                >
                  {`${value} `}
                </Text>
              )
            }
            return `${value} `
          })
        : text}
    </Text>
  )
}

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    textStyle: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.md2,
    },
    link: {
      textDecorationLine: 'underline',
    },
  })

export default ParsedText
