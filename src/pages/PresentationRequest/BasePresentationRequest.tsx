import { ParamListBase } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { ModalConfirmAction } from '@src/components'
import {
  AccreditationBox,
  CredentialMainInformation,
  MainButton,
  RadioButton,
  ServiceMainInfo,
  Text,
} from '@src/components/common'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { ServiceInfo, ServiceStatus } from '@src/model'
import { FormattedSubmission } from '@src/services/agent/formatPresentation'
import type { Accreditation } from '@src/services/verana/accreditation'
import { screenHeight } from '@src/utils/responsiveUtils'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, ScrollView, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import getStyles from './styles'

type Props = {
  navigation: StackNavigationProp<ParamListBase>
  submission: FormattedSubmission
  onSelectCredential: (...args: [string, string]) => void
  accept: () => void
  refuse: () => void
  isFetchingInfo?: boolean
  serviceInfo?: ServiceInfo | null
  failedFetchInfo?: boolean
  isAccepting: boolean
  notifyNoCompatibleCredentials: () => void
  scrollViewProps?: ScrollView['props']
  onRetryServiceInfo?: () => void
  accreditation?: Accreditation
  isCheckingAccreditation: boolean
  onRetryAccreditation: () => void
}

const BasePresentationRequest: React.FC<Props> = ({
  navigation,
  submission,
  onSelectCredential,
  accept,
  refuse,
  isFetchingInfo,
  serviceInfo,
  failedFetchInfo,
  isAccepting,
  notifyNoCompatibleCredentials,
  scrollViewProps,
  onRetryServiceInfo,
  accreditation,
  isCheckingAccreditation,
  onRetryAccreditation,
}) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const defaultSelectedCredentialsIndexes = new Array(submission.entries.length).fill(-1)
  const [selectedCredentialsIndexes, setSelectedCredentialsIndexes] = useState<number[]>(
    defaultSelectedCredentialsIndexes
  )
  const [showModalRefuseConfirmation, setShowModalRefuseConfirmation] = useState(false)
  const hasCompatibleCredentials = submission.entries.some((entry) => entry.credentials.length > 0)
  const [showModalUnsafeShare, setShowModalUnsafeShare] = useState(false)
  const trustStatus = isFetchingInfo ? ServiceStatus.Resolving : (serviceInfo?.status ?? ServiceStatus.Resolving)
  const canShare =
    trustStatus !== ServiceStatus.Resolving &&
    !isCheckingAccreditation &&
    accreditation !== undefined &&
    accreditation.status !== 'unverified'
  const isSafeToShare = trustStatus === ServiceStatus.Trusted && accreditation?.status === 'authorized'
  const enabledPresentButton = canShare && selectedCredentialsIndexes.every((value) => value >= 0)

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

  const onUnsafeShare = () => {
    setShowModalUnsafeShare(false)
    accept()
  }

  const updateSelectedCredential = (
    positionToUpdate: number,
    newValue: number,
    entryId: string,
    credentialId: string
  ) => {
    const newSelectedCredentialsIndexes = [...selectedCredentialsIndexes]
    newSelectedCredentialsIndexes[positionToUpdate] = newValue
    setSelectedCredentialsIndexes(newSelectedCredentialsIndexes)
    onSelectCredential(entryId, credentialId)
  }

  const goToCredentialDetails = (credentialRecordId: string) => {
    navigation.navigate('CredentialDetails', { credentialRecordId })
  }

  if (isAccepting) return <ActivityIndicator color={theme.colors.green} size={'large'} />
  return (
    <>
      <SafeAreaView style={styles.root} edges={['bottom']}>
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
                onRetry={onRetryServiceInfo}
              />
            )}
            <AccreditationBox
              party="VERIFIER"
              serviceName={submission.verifier.name || serviceInfo?.name || ''}
              accreditation={accreditation}
              isChecking={isCheckingAccreditation}
              onRetry={onRetryAccreditation}
            />
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
                  text={
                    isSafeToShare
                      ? t('credential.present', { count: submission?.entries?.length })
                      : t('accreditation.shareAnyway')
                  }
                  onPress={isSafeToShare ? accept : () => setShowModalUnsafeShare(true)}
                  style={[
                    enabledPresentButton ? styles.enabledAcceptButton : styles.disabledAcceptButton,
                    !isSafeToShare && styles.unsafeAcceptButton,
                  ]}
                  testID={isSafeToShare ? 'request-share' : 'request-share-unsafe'}
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
      <ModalConfirmAction
        visible={showModalUnsafeShare}
        title={t('accreditation.confirmUnsafeShare')}
        subTitle=""
        confirmText={t('accreditation.shareAnyway')}
        cancelText={t('general.cancel')}
        onClose={() => setShowModalUnsafeShare(false)}
        onConfirm={onUnsafeShare}
        onCancel={() => setShowModalUnsafeShare(false)}
      />
    </>
  )
}

export default BasePresentationRequest
