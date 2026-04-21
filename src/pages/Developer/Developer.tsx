import { CacheModuleConfig } from '@credo-ts/core'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, View, TouchableOpacity } from 'react-native'
import { FileLogger } from 'react-native-file-logger'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import Share from 'react-native-share'

import AppDependencies from './AppDependencies'
import getStyles from './styles'

import { ModalBottomHalf } from '@src/components'
import { NavigationStackParams } from '@src/components/Navigation/NavigationProps'
import { ModalLoading, OptionsList, Text, TextInput, Switch } from '@src/components/common'
import { Option } from '@src/components/common/OptionsList'
import { TextInputForwardRefProps } from '@src/components/common/TextInput'
import { IS_ANDROID, IS_IOS } from '@src/constants'
import { useMobileAgent } from '@src/hooks/agent'
import { useConfig } from '@src/hooks/providers/ConfigProvider'
import { useLocalRealm } from '@src/hooks/providers/RealmProvider'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { AgentActionQueueSingleton } from '@src/services/AgentActionQueueSingleton'
import AgentSingleton from '@src/services/AgentSingleton'
import { deleteAllKeys } from '@src/services/keys'
import { removeStorageData, USER_INVITATION_OUT_OF_BAND_RECORD_ID } from '@src/services/localStorage'
import { deleteDir, walletDirectoryPath } from '@src/utils/RNFS'
import {
  allDevEnvs,
  DevEnv,
  devEnvPlaceholder,
  DevEnvsKeys,
  DevEnvObject,
  saveLogsEnabled,
  areLogsEnabled,
} from '@src/utils/developer'
import { logError, LOGS_DIRECTORY } from '@src/utils/log'
import { toast } from '@src/utils/toast'

interface Props extends StackScreenProps<NavigationStackParams, 'Developer'> {}

const Developer = ({ navigation }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const [isDeletingWallet, setIsDeletingWallet] = useState(false)
  const [currentDevEnv, setCurrentDevEnv] = useState<DevEnv>()
  const [displayDevEnvOptions, setDisplayDevEnvOptions] = useState(false)
  const [tempCustomDevEnvValue, setTempCustomDevEnvValue] = useState<string>()
  const [isEditionCustomDevEnvMode, setIsEditionCustomDevEnvMode] = useState(false)
  const [logsEnabled, setAreLogsEnabled] = useState(false)
  const customDevInputRef = useRef<TextInputForwardRefProps>(null)
  const { agent, shutdownAgent } = useMobileAgent()
  const { realm, closeRealm } = useLocalRealm()
  const { devEnvs, updateDevEnvs, storedCustomDevEnvs, saveCustomDevEnv } = useConfig()
  const { t } = useTranslation()

  useEffect(() => {
    const setupAreLogsEnabled = async () => {
      const persistedAreLogsEnabled = await areLogsEnabled()
      setAreLogsEnabled(persistedAreLogsEnabled)
    }
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

      // FIXME: Workaround to make sure cache is unloaded from memory
      const cache = agent.dependencyManager.resolve(CacheModuleConfig).cache

      // @ts-expect-error we are sure property _cache exists
      // eslint-disable-next-line no-underscore-dangle
      cache._cache = undefined
      await shutdownAgent()

      // Delete store and wallet directory
      await agent.modules.askar.deleteStore()
      await deleteDir(walletDirectoryPath)
      await deleteAllKeys()
      await removeStorageData(USER_INVITATION_OUT_OF_BAND_RECORD_ID)
      closeRealm()
      AgentSingleton.instance.setAppIsSubscribedChatToEvents(false)
      AgentSingleton.instance.setIsAppSubscribedToConnectionEvents(false)
      AgentActionQueueSingleton.instance.reset()
      navigation.navigate('Home')
    } catch (error) {
      toast({ type: 'error', message: t('settings.deleteWalletError') })
      logError(`Error deleting wallet from developer screen: ${error}`)
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

  const toggleLogsEnabled = async () => {
    const newAreEnabled = !logsEnabled
    setAreLogsEnabled(newAreEnabled)
    await saveLogsEnabled(newAreEnabled)
    Alert.alert('¡INFO!', t('settings.closeAppAfterChange'))
  }

  const exportLogs = async () => {
    try {
      const logFilesPaths = await FileLogger.getLogFilePaths()
      if (!logFilesPaths.length) {
        Alert.alert(t('settings.noLogsFileFound'))
        return
      }
      Share.open({
        ...(IS_IOS ? { url: LOGS_DIRECTORY } : { urls: logFilesPaths.map(file => `file://${file}`) }),
        failOnCancel: false,
      })
    } catch (error) {
      Alert.alert(t('settings.couldNotExportLogs'))
      logError('Could not export app logs', error)
    }
  }

  const options: Option[] = [
    {
      iconName: 'trash',
      text: t('settings.deleteWallet'),
      onPress: confirmWalletDeletion,
    },
    {
      iconName: 'edit',
      text: t('settings.displayLogs'),
      rightContent: () => <Switch isChecked={logsEnabled} onToggle={toggleLogsEnabled} />,
    },
    {
      iconName: 'download',
      text: t('settings.exportLogs'),
      onPress: exportLogs,
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
              <Text style={styles.devEnvText}>{currentCustomDevEnvValue}</Text>
            </TouchableOpacity>
            <Text
              onPress={switchToEditionCustomDevEnv}
              fontFamily="EuclidCircularA-SemiBold"
              style={styles.textButton}
            >
              {t('general.modify')}
            </Text>
          </View>
        ) : (
          <Text
            onPress={switchToEditionCustomDevEnv}
            fontFamily="EuclidCircularA-SemiBold"
            style={{ ...styles.textButton, ...styles.createCustomDenEnvText }}
          >
            {t('settings.createCustomDevEnvValue')}
          </Text>
        )}
      </>
    )
  }

  return (
    <>
      <KeyboardAwareScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.subContainer}>
          <OptionsList options={options} />
          <Text fontFamily="EuclidCircularA-Medium" style={styles.title}>
            {t('settings.developmentEnvironments')}
          </Text>
          {isEditionCustomDevEnvMode && (
            <View style={styles.editionCustomDevEnvContainer}>
              <Text fontFamily="EuclidCircularA-SemiBold" style={styles.title}>
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
                  fontFamily="EuclidCircularA-SemiBold"
                  style={styles.textButton}
                >
                  {t('general.save')}
                </Text>
              </View>
            </View>
          )}
          <OptionsList options={devEnvsForRender} />
          <AppDependencies />
        </View>
      </KeyboardAwareScrollView>
      <ModalLoading visible={isDeletingWallet} />
      <ModalBottomHalf visible={displayDevEnvOptions} onClose={changeDevEnvOptionsVisibility}>
        {currentDevEnv && (
          <View style={styles.devEnvsModalContainer}>
            <Text fontFamily="EuclidCircularA-SemiBold" style={styles.title}>
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
                  <Text style={styles.devEnvText}>{option}</Text>
                </TouchableOpacity>
              )
            })}
            {renderCustomDevEnv()}
          </View>
        )}
      </ModalBottomHalf>
    </>
  )
}

export default Developer
