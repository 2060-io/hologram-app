import React, { useState, memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { View, TouchableOpacity } from 'react-native'

import { Header } from '../components'

import { QuestionAnswerOption, QuestionChatViewProps } from './QuestionChatViewProps'
import getStyles from './styles'

import { Text } from '@2060/components/common'
import { useChatActions } from '@2060/hooks'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'

const QuestionChatView = ({ question, associatedRecordId }: QuestionChatViewProps) => {
  const [optionSelected, setOptionSelected] = useState<string | undefined>(question.response)
  const theme = useTheme()
  const styles = getStyles(theme)
  const { t } = useTranslation()
  const options = JSON.parse(question.options) as QuestionAnswerOption[]
  const { sendAnswer } = useChatActions()

  const onSelectedOption = useCallback((response: string) => {
    setOptionSelected(response)
    sendAnswer(response, associatedRecordId)
  }, [])

  return (
    <>
      <Header title={t('personalChat.question')} theme={theme} leftIconName="question" />
      <View style={styles.containerMain}>
        <Text style={styles.description}>{question?.text}</Text>
        <View style={styles.containerOptions}>
          {options.map(option => (
            <TouchableOpacity
              key={option.text}
              activeOpacity={0.6}
              disabled={Boolean(optionSelected)}
              style={[
                styles.containerOption,
                optionSelected === option.value && styles.containerOptionSelected,
                { borderColor: optionSelected ? theme.colors.secondaryGrey : theme.colors.blue },
              ]}
              onPress={() => onSelectedOption(option.value)}
            >
              <Text
                typography="EuclidCircularA-SemiBold"
                style={[
                  styles.optionText,
                  {
                    color:
                      optionSelected === option.value
                        ? theme.colors.green
                        : optionSelected
                          ? theme.colors.secondaryGrey
                          : theme.colors.blue,
                  },
                ]}
              >
                {option.text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </>
  )
}

export default memo(QuestionChatView)
