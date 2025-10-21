import { PictureData } from '@2060.io/credo-ts-didcomm-user-profile'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useLayoutEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, TouchableOpacity, SafeAreaView } from 'react-native'

import getStyles from './styles'

import { UserProfileForm } from '@2060/components'
import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { Text } from '@2060/components/common'
import { useUserProfile } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { getGlobalStyles } from '@2060/styles'

interface Props extends StackScreenProps<NavigationStackParams, 'UserProfile'> {}

const UserProfile = ({ navigation }: Props) => {
  const { userProfileData, updateUserProfileData } = useUserProfile()
  const [displayName, setDisplayName] = useState(userProfileData?.displayName ?? '')
  const [displayPicture, setDisplayPicture] = useState<PictureData | undefined>(
    userProfileData?.displayPicture,
  )

  const theme = useTheme()
  const { t } = useTranslation()
  const isChangeBase64 = displayPicture?.base64 !== userProfileData?.displayPicture?.base64
  const isChangeDisplayName = displayName.trim() !== userProfileData?.displayName
  const globalStyles = getGlobalStyles(theme)
  const styles = getStyles(theme)

  const goToBack = () => navigation.canGoBack() && navigation.goBack()

  const onSaveInfoUser = () => {
    updateUserProfileData({ displayName: displayName.trim(), displayPicture })
    goToBack()
  }

  const onHandleCancelingValueChanges = () => {
    updateUserProfileData({
      displayName: userProfileData?.displayName,
      displayPicture: userProfileData?.displayPicture,
    })
    goToBack()
  }

  const handleChangeHeaderOptions = () => {
    navigation.setOptions({
      headerStyle: globalStyles.headerStyle,
      headerLeft: () => (
        <TouchableOpacity style={styles.headerLeft} onPress={onHandleCancelingValueChanges}>
          <Text fontFamily="EuclidCircularA-Medium" style={styles.headerBtnText}>
            {t('general.cancel')}
          </Text>
        </TouchableOpacity>
      ),
      headerRight: () =>
        (isChangeBase64 || isChangeDisplayName) && (
          <TouchableOpacity style={styles.headerRight} onPress={onSaveInfoUser}>
            <Text fontFamily="EuclidCircularA-Medium" style={styles.headerBtnText}>
              {t('general.done')}
            </Text>
          </TouchableOpacity>
        ),
    })
  }

  useLayoutEffect(handleChangeHeaderOptions, [displayName, displayPicture?.base64, theme])

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView style={styles.root}>
        <UserProfileForm
          displayName={displayName}
          displayPicture={displayPicture}
          onHandleChangeName={setDisplayName}
          onHandleChangePicture={setDisplayPicture}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

export default UserProfile
