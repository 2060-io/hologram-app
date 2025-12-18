import React, { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity, View } from 'react-native'

import getStyles from './styles'

import { ModalBottomHalf } from '@2060/components'
import { Switch, SvgIcon, OptionsList, Text } from '@2060/components/common'
import { Option } from '@2060/components/common/OptionsList'
import { IconsNames } from '@2060/components/common/SvgIcon'
import { AutomaticDownloadTypes, DownloadOptions, useFileUploadDownload } from '@2060/hooks/agent'
import {
  useScreenLock,
  INSTANT_TIMEOUT,
  FIVE_MINUTES_TIMEOUT,
} from '@2060/hooks/providers/ScreenLockProvider'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'

const mediaIconName: Record<keyof AutomaticDownloadTypes, keyof IconsNames> = {
  audio: 'microphone',
  images: 'camera',
  videos: 'video',
}

const SHORTHAND_TIMEOUT_TEXT: Record<number, string> = {
  60_000: '1m',
  [FIVE_MINUTES_TIMEOUT]: '5m',
  900_000: '15m',
  1_800_000: '30m',
  3_600_000: '1h',
  [INSTANT_TIMEOUT]: 'Inst',
}

const Privacy = () => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { automaticDownloadValues, changeAutomaticDownloadOption } = useFileUploadDownload()
  const { isScreenLockEnabled, onToggleLockScreen, changeScreenLockTimeout, screenLockTimeout } =
    useScreenLock()
  const [showLockTimeoutOptions, setShowLockTimeoutOptions] = useState(false)
  const currentAutomaticOptionForModal = useRef<{
    key: keyof AutomaticDownloadTypes
    value: DownloadOptions
  }>(undefined)
  const [showAutomaticDownloadOptions, setShowAutomaticDownloadOptions] = useState(false)

  const changeAutomaticDownloadOptionsVisibility = () => setShowAutomaticDownloadOptions(prev => !prev)
  const changeLockTimeoutOptionsVisibility = () => setShowLockTimeoutOptions(prev => !prev)

  const automaticDownloadTypeTexts: Record<keyof AutomaticDownloadTypes, string> = {
    audio: t('settings.audio'),
    images: t('settings.images'),
    videos: t('settings.videos'),
  }

  const automaticDownloadOptionTexts: Record<DownloadOptions, string> = {
    [DownloadOptions.Never]: t('settings.never'),
    [DownloadOptions.Wifi]: t('settings.wifi'),
    [DownloadOptions.WifiAndMobileData]: t('settings.wifiAndMobileData'),
  }

  const automaticDownloadOptions: Option[] = useMemo(() => {
    return Object.entries(automaticDownloadValues).map(([key, value]) => {
      const typedKey = key as keyof AutomaticDownloadTypes
      return {
        text: automaticDownloadTypeTexts[typedKey],
        onPress: () => onPressAutomaticDownloadOption(typedKey, value),
        rightContent: () => <Text style={styles.title}>{automaticDownloadOptionTexts[value]}</Text>,
        iconName: mediaIconName[typedKey],
      }
    })
  }, [automaticDownloadValues, theme.colors])

  const onPressAutomaticDownloadOption = (key: keyof AutomaticDownloadTypes, value: DownloadOptions) => {
    currentAutomaticOptionForModal.current = { key, value }
    changeAutomaticDownloadOptionsVisibility()
  }

  const onSelectAutomaticDownloadOption = (key: keyof AutomaticDownloadTypes, value: DownloadOptions) => {
    changeAutomaticDownloadOption(key, value, changeAutomaticDownloadOptionsVisibility)
  }

  const options: Option[] = [
    {
      iconName: 'lock',
      text: t('settings.screenLock'),
      rightContent: () => <Switch isChecked={isScreenLockEnabled} onToggle={onToggleLockScreen} />,
    },
    ...(isScreenLockEnabled
      ? ([
          {
            iconName: 'lock',
            text: t('settings.screenLockTimeout'),
            onPress: changeLockTimeoutOptionsVisibility,
            rightContent: () => (
              <View style={styles.screenLockOptionRow}>
                <Text style={styles.title}>
                  {screenLockTimeout !== null ? SHORTHAND_TIMEOUT_TEXT[screenLockTimeout] : null}
                </Text>
                <SvgIcon name="chevronForward" width={18} height={18} fill={theme.colors.tertiaryText} />
              </View>
            ),
          },
        ] as Option[])
      : []),
  ]

  const timeoutOptions = [
    { label: t('general.minute', { count: 1 }), value: 60_000 },
    { label: t('general.minute', { count: 5 }), value: FIVE_MINUTES_TIMEOUT },
    { label: t('general.minute', { count: 15 }), value: 900_000 },
    { label: t('general.minute', { count: 30 }), value: 1_800_000 },
    { label: t('general.hour', { count: 1 }), value: 3_600_000 },
    { label: t('general.instant'), value: INSTANT_TIMEOUT },
  ]

  const onPressTimeoutOption = (value: number) => {
    changeScreenLockTimeout(value)
    changeLockTimeoutOptionsVisibility()
  }

  return (
    <View style={styles.container}>
      <Text fontFamily="EuclidCircularA-SemiBold" style={styles.title}>
        {t('settings.appSecurity')}
      </Text>
      <Text style={styles.subTitle}>{t('settings.useOSAuthToProtectApp')}</Text>
      <OptionsList options={options} />
      <Text fontFamily="EuclidCircularA-SemiBold" style={[styles.title, styles.automaticMediaDownloadTitle]}>
        {t('settings.automaticMediaDownload')}
      </Text>
      <OptionsList options={automaticDownloadOptions} />
      <ModalBottomHalf visible={showLockTimeoutOptions} onClose={changeLockTimeoutOptionsVisibility}>
        <View style={styles.optionsContainer}>
          <Text fontFamily="EuclidCircularA-SemiBold" style={[styles.title, styles.timeoutOptionsTitle]}>
            {t('settings.screenLockTimeout')}
          </Text>
          {timeoutOptions.map(option => {
            const isSelected = option.value === screenLockTimeout
            return (
              <TouchableOpacity
                key={option.label}
                onPress={() => onPressTimeoutOption(option.value)}
                style={{ ...styles.optionContainer, ...(isSelected && styles.optionSelected) }}
              >
                <Text style={styles.option}>{option.label}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </ModalBottomHalf>
      <ModalBottomHalf
        visible={showAutomaticDownloadOptions}
        onClose={changeAutomaticDownloadOptionsVisibility}
      >
        <View style={styles.optionsContainer}>
          <Text fontFamily="EuclidCircularA-SemiBold" style={[styles.title, styles.timeoutOptionsTitle]}>
            {currentAutomaticOptionForModal.current?.key &&
              automaticDownloadTypeTexts[currentAutomaticOptionForModal.current.key]}
          </Text>
          {Object.values(DownloadOptions).map(option => {
            const isSelected = currentAutomaticOptionForModal.current?.value === option
            return (
              <TouchableOpacity
                key={option}
                style={{ ...styles.optionContainer, ...(isSelected && styles.optionSelected) }}
                onPress={() => {
                  if (currentAutomaticOptionForModal.current?.key) {
                    onSelectAutomaticDownloadOption(currentAutomaticOptionForModal.current.key, option)
                  }
                }}
              >
                <Text style={styles.option}>{automaticDownloadOptionTexts[option]}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </ModalBottomHalf>
    </View>
  )
}

export default Privacy
