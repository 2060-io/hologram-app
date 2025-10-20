import { CacheModuleConfig } from '@credo-ts/core'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, Alert, View, TouchableOpacity } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

import getStyles from './styles'

import { ModalBottomHalf } from '@2060/components'
import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { ModalLoading, OptionsList, Text, TextInput, Switch } from '@2060/components/common'
import { TextInputForwardRefProps } from '@2060/components/common/TextInput'
import { IS_ANDROID, IS_IOS } from '@2060/constants'
import { useMobileAgent } from '@2060/hooks/agent'
import { useConfig } from '@2060/hooks/providers/ConfigProvider'
import { useLocalRealm } from '@2060/hooks/providers/RealmProvider'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { deleteAllKeys } from '@2060/services/keys'
import {
  allDevEnvs,
  DevEnv,
  devEnvPlaceholder,
  DevEnvsKeys,
  DevEnvObject,
  isBackgroundNotificationHandlerEnabled,
  savePushNotificationHandlerEnabled,
  saveLogsEnabled,
  areLogsEnabled,
} from '@2060/utils/developer'

interface Props extends StackScreenProps<NavigationStackParams, 'Developer'> {}

const Developer = ({ navigation }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const [isDeletingWallet, setIsDeletingWallet] = useState(false)
  const [currentDevEnv, setCurrentDevEnv] = useState<DevEnv>()
  const [displayDevEnvOptions, setDisplayDevEnvOptions] = useState(false)
  const [tempCustomDevEnvValue, setTempCustomDevEnvValue] = useState<string>()
  const [isEditionCustomDevEnvMode, setIsEditionCustomDevEnvMode] = useState(false)
  const [areBackgroundNotificationsEnabled, setAreBackgroundNotificationsEnabled] = useState(false)
  const [logsEnabled, setAreLogsEnabled] = useState(false)
  const customDevInputRef = useRef<TextInputForwardRefProps>(null)
  const { agent, shutdownAgent } = useMobileAgent()
  const { realm, closeRealm } = useLocalRealm()
  const { devEnvs, updateDevEnvs, storedCustomDevEnvs, saveCustomDevEnv } = useConfig()
  const { t } = useTranslation()

  useEffect(() => {
    const setupBackgroundNotificationsEnabled = async () => {
      const persistedIsBackgroundNotificationsEnabled = await isBackgroundNotificationHandlerEnabled()
      setAreBackgroundNotificationsEnabled(persistedIsBackgroundNotificationsEnabled)
    }
    const setupAreLogsEnabled = async () => {
      const persistedAreLogsEnabled = await areLogsEnabled()
      setAreLogsEnabled(persistedAreLogsEnabled)
    }
    setupBackgroundNotificationsEnabled()
    setupAreLogsEnabled()
  }, [])

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

  const displayAlertAfterChange = () => {
    Alert.alert(
      IS_IOS ? t('settings.closeAppAfterChange') : '',
      IS_ANDROID ? t('settings.closeAppAfterChange') : '',
    )
  }

  const onSelectDevEnvOption = async (key: keyof DevEnvsKeys, value: string) => {
    changeDevEnvOptionsVisibility()
    const newDevEnvsToPersist = { ...devEnvs, [key]: value }
    await updateDevEnvs(newDevEnvsToPersist)
    if (key === 'INDY_VDR_PROXY_BASE_URL') displayAlertAfterChange()
  }

  const currentCustomDevEnvValue = currentDevEnv?.key ? storedCustomDevEnvs?.[currentDevEnv.key] : ''

  const onSaveCustomDevEnv = async () => {
    const newCustomDevEnvValue: DevEnvObject = {
      [currentDevEnv?.key as keyof DevEnvsKeys]: tempCustomDevEnvValue,
    }
    await saveCustomDevEnv(newCustomDevEnvValue)
    setTempCustomDevEnvValue('')
    setIsEditionCustomDevEnvMode(false)
    if (currentDevEnv?.key === 'INDY_VDR_PROXY_BASE_URL') displayAlertAfterChange()
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
      // FIXME: Workaround to make sure cache is unloaded from memory
      const cache = agent.dependencyManager.resolve(CacheModuleConfig).cache

      // @ts-expect-error we are sure property _cache exists
      // eslint-disable-next-line no-underscore-dangle
      cache._cache = undefined
      await shutdownAgent()
      await deleteAllKeys()
      closeRealm()
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

  const toggleBackgroundPushNotificationHandler = async () => {
    const newAreEnabled = !areBackgroundNotificationsEnabled
    setAreBackgroundNotificationsEnabled(newAreEnabled)
    await savePushNotificationHandlerEnabled(newAreEnabled)
    displayAlertAfterChange()
  }

  const toggleLogsEnabled = async () => {
    const newAreEnabled = !logsEnabled
    setAreLogsEnabled(newAreEnabled)
    await saveLogsEnabled(newAreEnabled)
  }

  const options = [
    {
      iconName: 'trash',
      text: t('settings.deleteWallet'),
      onPress: confirmWalletDeletion,
    },
    {
      iconName: 'notifications',
      text: t('settings.backgroundNotifications'),
      rightContent: () => (
        <Switch
          isChecked={areBackgroundNotificationsEnabled}
          onToggle={toggleBackgroundPushNotificationHandler}
        />
      ),
    },
    {
      iconName: 'edit',
      text: t('settings.displayLogs'),
      rightContent: () => <Switch isChecked={logsEnabled} onToggle={toggleLogsEnabled} />,
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
                ...styles.customDevEnvValue,
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
