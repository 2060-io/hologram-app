import { TypedArrayEncoder } from '@credo-ts/core'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { Text } from '@src/components/common'
import { NavigationStackParams } from '@src/components/Navigation/NavigationProps'
import { useMobileAgent } from '@src/hooks/agent/MobileAgentProvider'
import { AppTheme } from '@src/styles'
import { logError } from '@src/utils'
import React from 'react'
import { Linking, StyleSheet, TextProps } from 'react-native'

type ParsedTextProps = {
  theme: AppTheme
  text: string
  textProps?: TextProps
}

const ParsedText: React.FC<ParsedTextProps> = ({ theme, text, textProps }) => {
  const styles = getStyles(theme)
  const { agent } = useMobileAgent()
  const navigation = useNavigation<StackNavigationProp<NavigationStackParams>>()

  const onUrlPress = async (url: string) => {
    if (/^www\./i.test(url)) {
      onUrlPress(`https://${url}`)
      return
    }
    const invitation = await agent?.didcomm.oob.parseInvitation(url).catch(() => undefined)
    if (invitation) {
      navigation.navigate('Home', { _url: TypedArrayEncoder.toBase64Url(TypedArrayEncoder.fromUtf8String(url)) })
      return
    }
    Linking.openURL(url).catch(() => logError('No handler for URL:', url))
  }
  const textIncludesHttp = text?.includes('http')

  return (
    <Text style={styles.textStyle} {...textProps}>
      {textIncludesHttp
        ? text?.split?.(' ')?.map((value) => {
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
