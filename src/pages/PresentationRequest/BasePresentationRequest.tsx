import { ParamListBase } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View, TouchableOpacity, ScrollView, TouchableWithoutFeedback, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import getStyles from './styles'

import { ModalConfirmAction } from '@src/components'
import {
  CredentialMainInformation,
  MainButton,
  Text,
  ServiceMainInfo,
  RadioButton,
} from '@src/components/common'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { ServiceInfo } from '@src/model'
import { FormattedSubmission } from '@src/services/agent/formatPresentation'
import { screenHeight } from '@src/utils/responsiveUtils'

type Props = {
  navigation: StackNavigationProp<ParamListBase>
  submission: FormattedSubmission
  isFromDidComm?: boolean
  onSelectOpenIdCredential?: (...args: [number[]]) => void
  onSelectDidcommCredential?: (...args: [string, string]) => void
  accept: () => void
  refuse: () => void
  isFetchingInfo?: boolean
  serviceInfo?: ServiceInfo | null
  failedFetchInfo?: boolean
  isAccepting: boolean
  notifyNoCompatibleCredentials?: () => void
  scrollViewProps?: ScrollView['props']
}

const BasePresentationRequest: React.FC<Props> = ({
  navigation,
  submission,
  isFromDidComm = true,
  onSelectOpenIdCredential = () => {},
  onSelectDidcommCredential = () => {},
  accept,
  refuse,
  isFetchingInfo,
  serviceInfo,
  failedFetchInfo,
  isAccepting,
  notifyNoCompatibleCredentials = () => {},
  scrollViewProps,
}) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const defaultSelectedCredentialsIndexes = new Array(submission.entries.length).fill(-1)
  const [selectedCredentialsIndexes, setSelectedCredentialsIndexes] = useState<number[]>(
    defaultSelectedCredentialsIndexes,
  )
  const [showModalRefuseConfirmation, setShowModalRefuseConfirmation] = useState(false)
  const hasCompatibleCredentials = submission.entries.some(entry => entry.credentials.length > 0)

  useEffect(() => {
    if (!hasCompatibleCredentials) {
      notifyNoCompatibleCredentials()
    }
  }, [hasCompatibleCredentials])

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () =>
        hasCompatibleCredentials && !isAccepting ? (
          <TouchableOpacity style={styles.headerLeft} onPress={displayModalRefuseConfirmation}>
            <Text style={styles.headerBtnText} fontFamily="EuclidCircularA-Medium">
              {t('general.refuse')}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.headerLeft} onPress={() => navigation.goBack()}>
            <Text style={styles.headerBtnText} fontFamily="EuclidCircularA-Medium">
              {t('general.dismiss')}
            </Text>
          </TouchableOpacity>
        ),
    })
  }, [hasCompatibleCredentials, isAccepting])

  const displayModalRefuseConfirmation = () => setShowModalRefuseConfirmation(true)
  const hideModalRefuseConfirmation = () => setShowModalRefuseConfirmation(false)

  const onRefuse = () => {
    hideModalRefuseConfirmation()
    refuse()
  }

  const updateSelectedCredential = (
    positionToUpdate: number,
    newValue: number,
    entryId: string,
    credentialId: string,
  ) => {
    const newSelectedCredentialsIndexes = [...selectedCredentialsIndexes]
    newSelectedCredentialsIndexes[positionToUpdate] = newValue
    setSelectedCredentialsIndexes(newSelectedCredentialsIndexes)
    isFromDidComm
      ? onSelectDidcommCredential(entryId, credentialId)
      : onSelectOpenIdCredential(newSelectedCredentialsIndexes)
  }

  const enabledPresentButton = selectedCredentialsIndexes.every(value => value >= 0)

  const goToCredentialDetails = (credentialRecordId: string) => {
    navigation.navigate('CredentialDetails', { credentialRecordId })
  }
  if (isAccepting) return <ActivityIndicator color={theme.colors.green} size={'large'} />
  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <ModalConfirmAction
        visible={showModalRefuseConfirmation}
        title={t('chat.confirmRefusePresentCredential')}
        subTitle=""
        confirmText={t('general.confirm')}
        cancelText="No"
        onClose={hideModalRefuseConfirmation}
        onConfirm={onRefuse}
        onCancel={hideModalRefuseConfirmation}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ minHeight: screenHeight + 1 }}
        {...scrollViewProps}
      >
        <View style={styles.subContainer}>
          {serviceInfo && isFetchingInfo !== undefined && failedFetchInfo !== undefined && (
            <ServiceMainInfo
              isFetchingInfo={isFetchingInfo}
              serviceInfo={serviceInfo}
              failedFetchInfo={failedFetchInfo}
            />
          )}
          {hasCompatibleCredentials ? (
            <>
              <Text style={[styles.title, styles.mainTitle]}>
                {t('presentationRequest.selectCredentialYouWouldLikeToPresentTo')}
                <Text style={styles.title} fontFamily="EuclidCircularA-SemiBold">
                  {submission.verifier.name}
                </Text>
              </Text>
              {submission.entries.map((entry, entryIndex) => {
                const title = `${submission.verifier.name} ${t('presentationRequest.isRequestingYou')}`
                return (
                  <View key={entry.name}>
                    <Text style={styles.submissionSectionTitle} fontFamily="EuclidCircularA-SemiBold">
                      {entry.name}
                    </Text>
                    <Text style={styles.title}>
                      {title}
                      <Text style={styles.title} fontFamily="EuclidCircularA-SemiBold">
                        {entry?.requestedAttributes?.join(', ')}
                      </Text>
                    </Text>
                    <View style={styles.sectionContainer}>
                      {entry.credentials.map((credential, credentialIndex) => (
                        <TouchableWithoutFeedback
                          key={credential.id}
                          onPress={() => {
                            updateSelectedCredential(entryIndex, credentialIndex, entry.id, credential.id)
                          }}
                        >
                          <View style={styles.credentialContainer}>
                            <RadioButton
                              style={styles.radioButton}
                              isChecked={selectedCredentialsIndexes?.[entryIndex] === credentialIndex}
                            />
                            <CredentialMainInformation
                              credentialMainInfo={credential}
                              onPress={() => goToCredentialDetails(credential.recordId)}
                              size="medium"
                            />
                          </View>
                        </TouchableWithoutFeedback>
                      ))}
                    </View>
                  </View>
                )
              })}
              <MainButton
                disabled={!enabledPresentButton}
                text={t('credential.present', { count: submission?.entries?.length })}
                onPress={accept}
                style={enabledPresentButton ? styles.enabledAcceptButton : styles.disabledAcceptButton}
              />
            </>
          ) : (
            <View style={styles.noCompatibleCredentialContainer}>
              <Text style={styles.title}>{t('presentationRequest.noCredentials')}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default BasePresentationRequest
