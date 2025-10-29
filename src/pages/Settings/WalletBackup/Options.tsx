import React from 'react'
import { useTranslation } from 'react-i18next'
import { View, TouchableOpacity } from 'react-native'

import { SvgIcon, Text, OptionsList } from '@2060/components/common'
import { Option } from '@2060/components/common/OptionsList'

interface StyleObject {
  [key: string]: object
}

type Props = {
  options: Option[]
  styles: StyleObject
  tertiaryText: string
  startBackupProcess: () => void
}

const Options = ({ options, styles, tertiaryText, startBackupProcess }: Props) => {
  const { t } = useTranslation()
  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity style={styles.rowContainer} onPress={startBackupProcess}>
          <SvgIcon name="cloudDownload" fill={tertiaryText} width={26} height={26} />
          <Text style={styles.mediumText}>{t('settings.backupNow')}</Text>
        </TouchableOpacity>
      </View>
      <OptionsList options={options} />
    </>
  )
}

export default Options
