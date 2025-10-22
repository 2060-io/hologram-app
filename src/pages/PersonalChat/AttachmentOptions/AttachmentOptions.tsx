import { StackNavigationProp } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { View, TouchableOpacity } from 'react-native'

import getStyles from './styles'

import { PersonalChatStackParams } from '@2060/components/Navigation/NavigationProps'
import { SvgIcon, Text } from '@2060/components/common'
import { IconsNames } from '@2060/components/common/SvgIcon'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'

type Props = {
  closeAttachmentOptions(): void
  navigation: StackNavigationProp<PersonalChatStackParams>
  connectionId: string
}
type OptionId = 'present-credentials'
type Option = { id: OptionId; icon: keyof IconsNames }

const options: Option[] = [{ id: 'present-credentials', icon: 'id' }]

const AttachmentOptions: React.FC<Props> = ({ closeAttachmentOptions, navigation, connectionId }) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)

  const onSelectedOption: Record<OptionId, () => Promise<void> | void> = {
    'present-credentials': () => {
      closeAttachmentOptions()
      navigation.navigate('PresentCredentialsFromChat', { connectionId })
    },
  }
  const label: Record<OptionId, string> = {
    'present-credentials': t('credential.present'),
  }

  return (
    <View style={styles.subContainer}>
      {options.map(option => (
        <View style={styles.containerOptionCard} key={option.id}>
          <TouchableOpacity style={styles.containerOption} onPress={onSelectedOption[option.id]}>
            <SvgIcon name={option.icon} fill={theme.colors.primaryText} />
            <Text style={styles.optionText}>{label[option.id]}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  )
}

export default AttachmentOptions
