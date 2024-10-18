import { StackScreenProps } from '@react-navigation/stack'
import React, { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, Alert, View, TouchableOpacity } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

import getStyles from './styles'

import { ModalBottomHalf } from '@2060/components'
import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { ModalLoading, OptionsList, Text, TextInput } from '@2060/components/common'
import { TextInputForwardRefProps } from '@2060/components/common/TextInput'
import { useMobileAgent } from '@2060/hooks/agent'
import { useConfig } from '@2060/hooks/providers/ConfigProvider'
import { useLocalRealm } from '@2060/hooks/providers/RealmProvider'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { deleteAllKeys } from '@2060/services/keys'
import { allDevEnvs, DevEnv, devEnvPlaceholder, DevEnvsKeys, DevEnvObject } from '@2060/utils/developer'

interface Props extends StackScreenProps<NavigationStackParams, 'Developer'> {}

const Developer = ({ navigation }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const [isDeletingWallet, setIsDeletingWallet] = useState(false)
  const [currentDevEnv, setCurrentDevEnv] = useState<DevEnv>()
  const [displayDevEnvOptions, setDisplayDevEnvOptions] = useState(false)
  const [tempCustomDevEnvValue, setTempCustomDevEnvValue] = useState<string>()
  const [isEditionCustomDevEnvMode, setIsEditionCustomDevEnvMode] = useState(false)
  const customDevInputRef = useRef<TextInputForwardRefProps>(null)
  const { agent, shutdownAgent } = useMobileAgent()
  const { realm, closeRealm } = useLocalRealm()
  const { devEnvs, updateDevEnvs, storedCustomDevEnvs, saveCustomDevEnv } = useConfig()
  const { t } = useTranslation()

  const devEnvsForRender = useMemo(() => {
    return Object.entries(devEnvs ?? {}).map(([key, value]) => ({
      text: `${devEnvPlaceholder[key as keyof DevEnvsKeys]}:\n${value}`,
      onPress: () => onPressDevEnv(key as keyof DevEnvsKeys),
    }))
  }, [devEnvs])

  const changeDevEnvOptionsVisibility = () => setDisplayDevEnvOptions(prev => !prev)

  const onPressDevEnv = (key: keyof DevEnvsKeys) => {
    const newCurrentDevEnv = allDevEnvs.find(devEnv => devEnv.key === key)
    setCurrentDevEnv(newCurrentDevEnv)
    changeDevEnvOptionsVisibility()
  }

  const onSelectDevEnvOption = async (key: keyof DevEnvsKeys, value: string) => {
    changeDevEnvOptionsVisibility()
    const newDevEnvsToPersist = { ...devEnvs, [key]: value }
    await updateDevEnvs(newDevEnvsToPersist)
  }

  const currentCustomDevEnvValue = currentDevEnv?.key ? storedCustomDevEnvs?.[currentDevEnv.key] : ''

  const onSaveCustomDevEnv = async () => {
    const newCustomDevEnvValue: DevEnvObject = {
      [currentDevEnv?.key as keyof DevEnvsKeys]: tempCustomDevEnvValue,
    }
    await saveCustomDevEnv(newCustomDevEnvValue)
    setTempCustomDevEnvValue('')
    setIsEditionCustomDevEnvMode(false)
  }

  const switchToEditionCustomDevEnv = () => {
    setTempCustomDevEnvValue(currentCustomDevEnvValue)
    changeDevEnvOptionsVisibility()
    setIsEditionCustomDevEnvMode(true)
    setTimeout(() => {
      customDevInputRef?.current?.onFocus()
    }, 500)
  }

  const deleteWallet = async () => {
    if (!agent) return
    setIsDeletingWallet(true)
    try {
      realm?.write(() => realm?.deleteAll())
      await agent.wallet.delete()
      await shutdownAgent()
      await deleteAllKeys()
      closeRealm(true)
      navigation.navigate('Home')
    } catch (error) {
      Alert.alert('Error', `${error}`)
    } finally {
      setIsDeletingWallet(false)
    }
  }

  const confirmWalletDeletion = () => {
    const title = t('settings.deleteWalletTitle')
    const message = t('settings.deleteWalletMessage')
    Alert.alert(title, message, [
      { text: t('general.yesDelete'), style: 'default', onPress: deleteWallet },
      { text: t('general.cancel'), style: 'destructive' },
    ])
  }

  const options = [
    {
      iconName: 'trash',
      text: t('settings.deleteWallet'),
      onPress: confirmWalletDeletion,
    },
  ]

  const renderCustomDevEnv = () => {
    if (!currentDevEnv) return null
    const currentDevEnvSelected = devEnvs?.[currentDevEnv.key]
    const isSelected = currentCustomDevEnvValue === currentDevEnvSelected
    return (
      <>
        {currentCustomDevEnvValue ? (
          <View style={styles.rowContainer}>
            <TouchableOpacity
              key={currentCustomDevEnvValue}
              style={{
                flex: 1,
                marginRight: 4,
                ...styles.optionContainer,
                ...(isSelected && styles.optionSelected),
              }}
              onPress={() => onSelectDevEnvOption(currentDevEnv.key, currentCustomDevEnvValue)}
            >
              <Text typography="EuclidCircularA-Regular" style={styles.devEnvText}>
                {currentCustomDevEnvValue}
              </Text>
            </TouchableOpacity>
            <Text
              onPress={switchToEditionCustomDevEnv}
              typography="EuclidCircularA-SemiBold"
              style={styles.textButton}
            >
              {t('general.modify')}
            </Text>
          </View>
        ) : (
          <Text
            onPress={switchToEditionCustomDevEnv}
            typography="EuclidCircularA-SemiBold"
            style={{ ...styles.textButton, ...styles.createCustomDenEnvText }}
          >
            {t('settings.createCustomDevEnvValue')}
          </Text>
        )}
      </>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAwareScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.subContainer}>
          <ModalLoading visible={isDeletingWallet} />
          <OptionsList options={options} />
          <Text typography="EuclidCircularA-Medium" style={styles.title}>
            {t('settings.developmentEnvironments')}
          </Text>
          {isEditionCustomDevEnvMode && (
            <View style={styles.editionCustomDevEnvContainer}>
              <Text typography="EuclidCircularA-SemiBold" style={styles.title}>
                {currentDevEnv?.key && devEnvPlaceholder[currentDevEnv.key]}
              </Text>
              <View style={styles.rowContainer}>
                <TextInput
                  ref={customDevInputRef}
                  value={tempCustomDevEnvValue}
                  onChangeText={setTempCustomDevEnvValue}
                  placeholder={t('general.valueHere')}
                  style={styles.textInput}
                />
                <Text
                  disabled={!tempCustomDevEnvValue?.length}
                  onPress={onSaveCustomDevEnv}
                  typography="EuclidCircularA-SemiBold"
                  style={styles.textButton}
                >
                  {t('general.save')}
                </Text>
              </View>
            </View>
          )}
          <OptionsList options={devEnvsForRender} />
          <ModalBottomHalf visible={displayDevEnvOptions} onClose={changeDevEnvOptionsVisibility}>
            {currentDevEnv && (
              <View style={styles.devEnvsModalContainer}>
                <Text typography="EuclidCircularA-SemiBold" style={styles.title}>
                  {devEnvPlaceholder[currentDevEnv.key]}
                </Text>
                {currentDevEnv.values.map(option => {
                  const currentDevEnvSelected = devEnvs?.[currentDevEnv.key]
                  const isSelected = option === currentDevEnvSelected
                  return (
                    <TouchableOpacity
                      key={option}
                      style={{ ...styles.optionContainer, ...(isSelected && styles.optionSelected) }}
                      onPress={() => onSelectDevEnvOption(currentDevEnv.key, option)}
                    >
                      <Text typography="EuclidCircularA-Regular" style={styles.devEnvText}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
                {renderCustomDevEnv()}
              </View>
            )}
          </ModalBottomHalf>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  )
}

export default Developer
