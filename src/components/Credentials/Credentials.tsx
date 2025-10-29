import { ParamListBase } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View, FlatList, TouchableOpacity } from 'react-native'

import SearchInput from '../SearchInput'

import getStyles from './styles'

import { CredentialMainInformation, HeaderTitle, SvgIcon, Text } from '@2060/components/common'
import { useCredentials } from '@2060/hooks/agent/CredentialProvider'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { getCredentialMainInfo } from '@2060/services/agent/display'

type Props = {
  navigation: StackNavigationProp<ParamListBase>
  headerTitle: string
  onPressCredential: (credentialRecordId: string) => void
}

const Credentials = ({ navigation, headerTitle, onPressCredential }: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { records } = useCredentials()
  const [search, setSearch] = useState('')
  const [showSearchInput, setShowSearchInput] = useState(false)

  const renderHeaderTitle = () => <HeaderTitle title={headerTitle} theme={theme} />

  const renderSearchInput = () => (
    <SearchInput
      containerStyle={styles.searchInputContainer}
      value={search}
      placeholder={t('credential.searchCredentials')}
      onDebounced={setSearch}
      renderLeftIcon={() => (
        <TouchableOpacity onPress={() => setShowSearchInput(false)}>
          <SvgIcon name="arrowLeft" width={18} height={18} fill={theme.colors.secondaryText} />
        </TouchableOpacity>
      )}
      textInputProps={{ autoFocus: true }}
    />
  )
  useEffect(() => {
    navigation.setOptions({
      headerTitle: showSearchInput ? renderSearchInput : renderHeaderTitle,
      headerRight: () =>
        !showSearchInput && (
          <TouchableOpacity style={styles.headerRight} onPress={() => setShowSearchInput(true)}>
            <SvgIcon name="search" fill={theme.colors.primaryText} />
          </TouchableOpacity>
        ),
    })
  }, [showSearchInput, theme.colors])

  const credentials = useMemo(() => {
    return records
      .map(getCredentialMainInfo)
      .filter(credential => {
        const credentialDisplayName = credential.schemaName ?? ''
        const credentialIssuerName = credential.issuer.name ?? ''

        return (
          credentialDisplayName.toLocaleLowerCase().includes(search.toLocaleLowerCase()) ||
          credentialIssuerName.toLocaleLowerCase().includes(search.toLocaleLowerCase())
        )
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }, [records, search])

  return (
    <View style={styles.container}>
      <FlatList
        showsVerticalScrollIndicator={false}
        data={credentials}
        renderItem={({ item: credential }) => (
          <CredentialMainInformation
            credentialMainInfo={credential}
            onPress={() => onPressCredential(credential.recordId)}
          />
        )}
        ListEmptyComponent={() => {
          const iconName = theme.isDarkMode ? 'darkCredentialCardSkeleton' : 'lightCredentialCardSkeleton'
          return (
            <View style={styles.noCredentialsContainer}>
              <Text style={[styles.noCredentialsMessage, styles.noCredentialsMessageP1]}>
                {t('credential.noCredentials')}
              </Text>
              <SvgIcon name={iconName} {...styles.noCredentialCardSkeleton} fill={undefined} />
              <View style={styles.nestedCardSkeletonContainer}>
                <SvgIcon name={iconName} {...styles.noCredentialCardSkeleton} fill={undefined} />
              </View>
              <View style={styles.nestedCardSkeletonContainer}>
                <SvgIcon name={iconName} {...styles.noCredentialCardSkeleton} fill={undefined} />
              </View>
            </View>
          )
        }}
      />
    </View>
  )
}

export default Credentials
