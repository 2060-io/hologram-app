import { SvgIcon, Text } from '@src/components/common'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity, View } from 'react-native'
import { IconsNames } from '../common/SvgIcon'
import getStyles from './styles'

const defaultOptions = [
  { id: '1', name: 'allChats', value: 'all' },
  { id: '2', name: 'people', value: 'people' },
  { id: '3', name: 'services', value: 'services' },
  { id: '4', name: 'archived', value: 'archived' },
]

type Props = {
  onChangeOption(option: string): void
  selectedOption: string
  options?: {
    id: string
    name: string
    value: string
  }[]
}

const ChatFilterOptions: React.FC<Props> = ({ options = defaultOptions, selectedOption, onChangeOption }) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { t } = useTranslation()
  return (
    <View style={styles.container}>
      {options.map((option) => (
        <View
          key={option.id}
          style={[styles.containerOptionCard, option.value === selectedOption && styles.btnTextFilterOptionSelected]}
        >
          <TouchableOpacity
            style={styles.containerOption}
            activeOpacity={0.9}
            onPress={() => onChangeOption(option.value)}
          >
            <SvgIcon
              name={(option.name === 'allChats' ? 'messages' : option.name) as keyof IconsNames}
              fill={theme.colors.blue}
            />
            <Text style={styles.btnOptionText}>{`${t(`chat.${option.name}`)}`}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  )
}

export default ChatFilterOptions
