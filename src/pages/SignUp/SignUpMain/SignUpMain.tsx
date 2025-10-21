import { StackActions } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { View, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native'

import { version } from '../../../../package.json'

import getStyles from './styles'

import AppLogo from '@2060/assets/icons/AppLogo'
import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { Text, SvgIcon } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'

interface Props extends StackScreenProps<NavigationStackParams, 'Home'> {}

const SignUpMain = ({ navigation }: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)

  const goToRestoreBackup = () => navigation.dispatch(StackActions.push('RestoreWalletBackup'))
  const goToProfileCreation = () => navigation.dispatch(StackActions.push('ProfileCreation'))

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainerStyle}>
        <View style={styles.innerRoot}>
          <AppLogo style={styles.containerAppLogo} />
          <Text typography="EuclidCircularA-Bold" style={styles.title}>
            {t('signUp.welcomeTitle')}
          </Text>
          <Text style={styles.subTitle} typography="EuclidCircularA-Regular">
            {t('signUp.welcomeSubTitle')}
          </Text>
          <View style={styles.containerNavigationOptions}>
            <TouchableOpacity
              activeOpacity={0.5}
              onPress={goToRestoreBackup}
              style={[styles.containerOption, styles.itemSeparator]}
            >
              <SvgIcon name="backupRestore" fill={theme.colors.primaryText} />
              <Text typography="EuclidCircularA-Regular" style={styles.optionText}>
                {t('signUp.restoreABackup')}
              </Text>
              <View style={styles.containerIconChevronForward}>
                <SvgIcon name="chevronForward" width={20} height={20} fill={theme.colors.primaryText} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.5}
              onPress={goToProfileCreation}
              style={styles.containerOption}
            >
              <SvgIcon name="addWallet" fill={theme.colors.primaryText} />
              <Text typography="EuclidCircularA-Regular" style={styles.optionText}>
                {t('signUp.createNewWallet')}
              </Text>
              <View style={styles.containerIconChevronForward}>
                <SvgIcon name="chevronForward" width={20} height={20} fill={theme.colors.primaryText} />
              </View>
            </TouchableOpacity>
          </View>
          <Text style={styles.appVersionText}>{version}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default SignUpMain
