import { Avatar, CredentialMainInformation, SvgIcon, Text } from '@src/components/common'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { CredentialMainInfo } from '@src/services/agent/display'
import { dateToString } from '@src/utils/dateUtils'
import { widthPercentageToDP } from '@src/utils/responsiveUtils'
import { Skeleton } from 'moti/skeleton'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import { uses24HourClock } from 'react-native-localize'
import getStyles from './styles'

type Props = {
  credentials: CredentialMainInfo[]
  verifierName: string
  verifierPicture: string | undefined
  type: 'approved' | 'rejected'
  viewInChatButton?: () => void
}

const CredentialPresented = ({ credentials, verifierName, verifierPicture, type, viewInChatButton }: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const using24HourFormat = uses24HourClock()

  const header: Record<Props['type'], React.JSX.Element> = {
    approved: <SvgIcon fill={theme.colors.green} name="done" width={64} height={64} />,
    rejected: (
      <View style={styles.rejectedIconContainer}>
        <SvgIcon fill={theme.colors.white} name="close" width={64} height={64} />
      </View>
    ),
  }
  const title: Record<Props['type'], string> = {
    approved: t('presentationRequest.successfullyReceived'),
    rejected: t('presentationRequest.rejected'),
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.subContainer}>
          {header[type]}
          <Text style={[styles.title, styles.mainTitle]}>
            {title[type]}
            {verifierName.length > 0 && t('general.by')}
            {verifierName.length > 0 && (
              <Text style={styles.title} fontFamily="EuclidCircularA-SemiBold">
                {verifierName}
              </Text>
            )}
          </Text>
          {credentials.map((credential) => (
            <CredentialMainInformation key={credential.id} credentialMainInfo={credential} />
          ))}
          <View style={styles.card}>
            <View style={styles.presentedDateContainer}>
              <SvgIcon fill={theme.isDarkMode ? theme.colors.secondaryGrey : '#6A8994'} name="personSquare" />
              <View style={styles.presentedDateText}>
                <Text fontFamily="EuclidCircularA-Bold" style={styles.presentedText}>
                  {t('presentationRequest.presented')}
                </Text>
                <Text style={styles.presentedText}>
                  {dateToString(new Date(), `DD-MM-YYYY ${using24HourFormat ? 'HH:mm' : 'h:mm A'}`)}
                </Text>
              </View>
            </View>
            <View style={styles.issuerContainer}>
              <Skeleton
                height={widthPercentageToDP('13%')}
                width={widthPercentageToDP('13%')}
                colorMode={theme.isDarkMode ? 'dark' : 'light'}
                radius="round"
                show={!verifierPicture?.length && !verifierName.length}
              >
                <Avatar uri={verifierPicture} label={verifierName} size="13%" />
              </Skeleton>
              <View style={styles.verifierNameContainer}>
                <Skeleton
                  height={styles.verifierName.fontSize + 2}
                  width="75%"
                  colorMode={theme.isDarkMode ? 'dark' : 'light'}
                  radius="round"
                  show={!verifierName.length}
                >
                  <Text fontFamily="EuclidCircularA-Medium" style={styles.verifierName}>
                    {verifierName}
                  </Text>
                </Skeleton>
              </View>
            </View>
            {viewInChatButton && (
              <TouchableOpacity style={styles.viewInChatButton} onPress={viewInChatButton}>
                <Text style={styles.viewInChatText}>{t('presentationRequest.viewInChat')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default CredentialPresented
