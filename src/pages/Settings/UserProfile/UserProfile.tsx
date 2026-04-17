import { DidCommUserProfileData } from '@2060.io/credo-ts-didcomm-user-profile'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, TouchableOpacity } from 'react-native'

import getStyles from './styles'

import { UserProfileForm } from '@src/components'
import { NavigationStackParams } from '@src/components/Navigation/NavigationProps'
import { Text } from '@src/components/common'
import { useUserProfile } from '@src/hooks/agent'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { getGlobalStyles } from '@src/styles'

type Props = StackScreenProps<NavigationStackParams, 'UserProfile'>

const UserProfile = ({ navigation }: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const globalStyles = getGlobalStyles(theme)
  const styles = getStyles(theme)
  const { userProfileData, updateUserProfileData } = useUserProfile()
  const [displayName, setDisplayName] = useState(userProfileData?.displayName)
  const [displayPicture, setDisplayPicture] = useState<DidCommUserProfileData['displayPicture']>(
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
    <ScrollView style={styles.root}>
      <UserProfileForm
        displayName={displayName}
        displayPicture={displayPicture}
        onHandleChangeName={setDisplayName}
        onHandleChangePicture={setDisplayPicture}
      />
    </ScrollView>
  )
}

export default UserProfile
