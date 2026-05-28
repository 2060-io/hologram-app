import { StackScreenProps } from '@react-navigation/stack'
import { MainButton, SvgIcon, Text, TextInputPassword, VerifiedIcon } from '@src/components/common'
import { NavigationStackParams } from '@src/components/Navigation/NavigationProps'
import { IS_IOS } from '@src/constants'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { toast } from '@src/utils/toast'
import { setBackupKey } from '@src/utils/walletBackUpUtils'
import { TrustResolutionOutcome } from '@verana-labs/verre'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, KeyboardAvoidingView, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import getStyles from './styles'

enum PasswordSteps {
  TypePass = 'typePass',
  RetypePass = 'retypePass',
  Updated = 'updated',
}

type Props = StackScreenProps<NavigationStackParams, 'ChangeBackupPassword'>

const ChangeBackupPassword = ({ navigation }: Props) => {
  const { t } = useTranslation()
  const [password, setPassword] = useState('')
  const [retypedPassword, setRetypedPassword] = useState('')
  const [currentStep, setCurrentStep] = useState<PasswordSteps>(PasswordSteps.TypePass)
  const theme = useTheme()
  const styles = getStyles(theme)

  useEffect(() => {
    let navigationOptions = {
      headerLeft: () =>
        currentStep === PasswordSteps.TypePass && (
          <TouchableOpacity style={styles.headerLeft} onPress={() => navigation.goBack()}>
            <Text fontFamily="EuclidCircularA-Medium" style={[styles.headerText]}>
              {t('general.cancel')}
            </Text>
          </TouchableOpacity>
        ),
      headerRight: () =>
        password && (
          <TouchableOpacity style={styles.headerRight} onPress={continueToRetypePassword}>
            <Text fontFamily="EuclidCircularA-Medium" style={[styles.headerText]}>
              {t('general.next')}
            </Text>
          </TouchableOpacity>
        ),
    }
    if (currentStep === PasswordSteps.RetypePass) {
      navigationOptions = {
        headerLeft: () => (
          <TouchableOpacity style={styles.headerLeft} onPress={goBackToTypePassword}>
            <SvgIcon name="arrowBack" width={28} height={28} fill={theme.colors.tertiaryText} />
          </TouchableOpacity>
        ),
        headerRight: () =>
          retypedPassword && (
            <TouchableOpacity style={styles.headerRight} onPress={onRequestSavePassword}>
              <Text fontFamily="EuclidCircularA-Medium" style={[styles.headerText]}>
                {t('general.next')}
              </Text>
            </TouchableOpacity>
          ),
      }
    }
    navigation.setOptions({ ...navigationOptions, gestureEnabled: false })
  }, [password, retypedPassword, currentStep, theme.colors])

  const continueToRetypePassword = () => setCurrentStep(PasswordSteps.RetypePass)
  const goBackToTypePassword = () => setCurrentStep(PasswordSteps.TypePass)
  const continueToSuccessUpdated = () => setCurrentStep(PasswordSteps.Updated)

  const onRequestSavePassword = () => {
    if (password === retypedPassword) {
      savePassword()
    } else {
      toast({ type: 'error', message: t('settings.passwordsDontMatch'), position: 'center' })
    }
  }

  const savePassword = async () => {
    await setBackupKey(password)
    setPassword('')
    setRetypedPassword('')
    continueToSuccessUpdated()
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={IS_IOS ? 'padding' : 'height'}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.subContainer}>
          {currentStep === PasswordSteps.TypePass && (
            <View style={styles.passwordsContainer}>
              <Text fontFamily="EuclidCircularA-Medium" style={styles.title}>
                {t('settings.changePassword')}
              </Text>
              <TextInputPassword
                autoFocus
                value={password}
                onChangeText={setPassword}
                placeholder={t('settings.typePassword')}
              />
            </View>
          )}
          {currentStep === PasswordSteps.RetypePass && (
            <View style={styles.passwordsContainer}>
              <Text fontFamily="EuclidCircularA-Medium" style={[styles.title, styles.titleRetypePass]}>
                {t('settings.reTypePassword')}
              </Text>
              <Text style={styles.suggestion}>{t('settings.savePassMessage')}</Text>
              <TextInputPassword
                autoFocus
                value={retypedPassword}
                onChangeText={setRetypedPassword}
                placeholder={t('settings.reTypePassword')}
              />
            </View>
          )}
          {currentStep === PasswordSteps.Updated && (
            <>
              <View style={styles.successUpdated}>
                <VerifiedIcon style={styles.verifiedIconContainer} status={TrustResolutionOutcome.VERIFIED} />
                <Text fontFamily="EuclidCircularA-Medium" style={styles.title}>
                  {t('settings.passwordSaved')}
                </Text>
              </View>
              <MainButton text={t('general.ok')} onPress={() => navigation.goBack()} />
            </>
          )}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  )
}

export default ChangeBackupPassword
