import React, { useCallback } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { View, Linking } from 'react-native'

import { ServiceSecuritySystemMessageProps } from './Props'
import getStyles from './styles'

import { SvgIcon, Text } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { getFlagEmoji } from '@2060/utils'
import { toast } from '@2060/utils/toast'

const ServiceSecuritySystemMessage = ({ serviceInfo }: ServiceSecuritySystemMessageProps) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)

  const serviceProvider = serviceInfo.serviceProvider

  const tryToOpenURL = useCallback(async (url: string | undefined) => {
    if (!url) return
    const supported = await Linking.canOpenURL(url)
    if (supported) {
      await Linking.openURL(url)
    } else {
      toast({ type: 'error', message: `${t('general.canNotOpenURL')} ${url}` })
    }
  }, [])

  return (
    <View style={styles.containerSecurityMessage}>
      <Trans
        i18nKey="chat.securityMessageService"
        style={styles.textMessageForService}
        parent={Text}
        components={{
          lock: <SvgIcon name="lock" fill={styles.textMessage.color} width={12} height={12} />,
          bold: <Text fontFamily="EuclidCircularA-Bold" style={styles.textMessageForService} />,
        }}
      />
      {serviceProvider ? (
        <>
          <Text fontFamily="EuclidCircularA-Medium" style={styles.textMessageForService}>
            {t('invitation.serviceProvider')}
            <Text style={styles.textMessageForService}>
              {` ${getFlagEmoji(serviceProvider.countryCode)} ${serviceProvider.entityName} ${
                serviceProvider.officialPublicRegistryNumber
              }`}
            </Text>
          </Text>
          <Trans
            i18nKey="connection.usingThisServiceYouAgree"
            style={styles.textMessageForService}
            values={{
              minimumAgeRequired:
                serviceInfo.minimumAgeRequired > 0
                  ? `${serviceInfo.minimumAgeRequired}+`
                  : t('invitation.noAgeRestrictions'),
            }}
            parent={Text}
            components={{
              terms: (
                <Text
                  onPress={() => tryToOpenURL(serviceInfo.termsAndConditionsUrl)}
                  style={[styles.textMessageForService, styles.underLineText]}
                />
              ),
              privacy: (
                <Text
                  onPress={() => tryToOpenURL(serviceInfo.dataPrivacyUrl)}
                  style={[styles.textMessageForService, styles.underLineText]}
                />
              ),
            }}
          />
        </>
      ) : (
        <>
          <Trans
            i18nKey="connection.noLiabilityDisclaimerDesc"
            style={styles.textMessageForService}
            values={{ serviceName: serviceInfo?.name }}
            parent={Text}
            components={{
              bold: <Text fontFamily="EuclidCircularA-Bold" style={styles.textMessageForService} />,
              red: <Text fontFamily="EuclidCircularA-Medium" style={styles.disclaimer} />,
            }}
          />
        </>
      )}
    </View>
  )
}

export default ServiceSecuritySystemMessage
