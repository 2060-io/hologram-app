import { JsonEncoder } from '@credo-ts/core'
import { StackActions, useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { Text } from '@src/components/common'
import { NavigationStackParams } from '@src/components/Navigation/NavigationProps'
import { useMobileAgent } from '@src/hooks/agent/MobileAgentProvider'
import { AppTheme } from '@src/styles'
import { logError } from '@src/utils'
import React, { useRef } from 'react'
import { Linking, StyleSheet, TextProps } from 'react-native'

type ParsedTextProps = {
  theme: AppTheme
  text: string
  textProps?: TextProps
}

const INVITATION_CHECK_TIMEOUT_MS = 5000

const ParsedText: React.FC<ParsedTextProps> = ({ theme, text, textProps }) => {
  const styles = getStyles(theme)
  const { agent } = useMobileAgent()
  const navigation = useNavigation<StackNavigationProp<NavigationStackParams>>()
  const isOpeningUrl = useRef(false)

  const parseInvitation = (url: string) =>
    Promise.race([
      agent?.didcomm.oob.parseInvitation(url).catch(() => undefined),
      new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), INVITATION_CHECK_TIMEOUT_MS)),
    ])

  const onUrlPress = async (url: string) => {
    if (/^www\./i.test(url)) {
      onUrlPress(`https://${url}`)
      return
    }
    if (isOpeningUrl.current) return
    isOpeningUrl.current = true
    try {
      const invitation = await parseInvitation(url)
      if (invitation) {
        const oob = JsonEncoder.toBase64Url((invitation.v2Invitation ?? invitation).toJSON())
        navigation.dispatch(StackActions.popTo('Home', { oob }))
        return
      }
      Linking.openURL(url).catch(() => logError('No handler for URL:', url))
    } finally {
      isOpeningUrl.current = false
    }
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
