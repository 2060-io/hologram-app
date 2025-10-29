import { UserProfileData } from '@2060.io/credo-ts-didcomm-user-profile'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect, useState } from 'react'
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
  const { t } = useTranslation()
  const theme = useTheme()
  const globalStyles = getGlobalStyles(theme)
  const styles = getStyles(theme)
  const { userProfileData, updateUserProfileData } = useUserProfile()
  const [displayName, setDisplayName] = useState(userProfileData?.displayName)
  const [displayPicture, setDisplayPicture] = useState<UserProfileData['displayPicture']>(
    userProfileData?.displayPicture,
  )
  const hasChangedPicture =
    displayPicture && userProfileData?.displayPicture
      ? displayPicture.base64 !== userProfileData.displayPicture.base64
      : displayPicture !== userProfileData?.displayPicture
  const hasChangedName = displayName?.trim() !== userProfileData?.displayName

  useEffect(() => {
    const handleChangeHeaderOptions = () => {
      navigation.setOptions({
        headerStyle: globalStyles.headerStyle,
        headerLeft: () => (
          <TouchableOpacity style={styles.headerLeft} onPress={goToBack}>
            <Text fontFamily="EuclidCircularA-Medium" style={styles.headerBtnText}>
              {t('general.cancel')}
            </Text>
          </TouchableOpacity>
        ),
        headerRight: () =>
          (hasChangedName || hasChangedPicture) && (
            <TouchableOpacity style={styles.headerRight} onPress={onSaveInfoUser}>
              <Text fontFamily="EuclidCircularA-Medium" style={styles.headerBtnText}>
                {t('general.done')}
              </Text>
            </TouchableOpacity>
          ),
      })
    }
    handleChangeHeaderOptions()
  }, [hasChangedName, hasChangedPicture, displayName, displayPicture, theme])

  const goToBack = () => navigation.goBack()

  const onSaveInfoUser = () => {
    updateUserProfileData({ displayName: displayName?.trim(), displayPicture })
    goToBack()
  }

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
