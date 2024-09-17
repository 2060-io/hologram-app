import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, View, FlatList, TouchableOpacity } from 'react-native'

import getStyles from './styles'

import { SearchInput } from '@2060/components'
import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { CardCredentialMainInformation, HeaderTitle, SvgIcon, Text } from '@2060/components/common'
import { useCredentials } from '@2060/hooks/agent/CredentialProvider'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { getCredentialMainInfo } from '@2060/services/agent/display'

interface Props extends StackScreenProps<NavigationStackParams, 'Wallet'> {}
const Wallet = ({ navigation }: Props) => {
  const [search, setSearch] = useState('')
  const [showSearchInput, setShowSearchInput] = useState(false)

  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)

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

  const renderHeaderTitle = () => <HeaderTitle title={t('general.credentials')} theme={theme} />

  useEffect(() => {
    navigation.setOptions({
      headerTitle: showSearchInput ? renderSearchInput : renderHeaderTitle,
      title: t('general.credentials'),
      headerRight: () =>
        !showSearchInput && (
          <TouchableOpacity style={styles.headerRight} onPress={() => setShowSearchInput(true)}>
            <SvgIcon name="search" fill={theme.colors.primaryText} />
          </TouchableOpacity>
        ),
    })
  }, [showSearchInput, theme.colors])

  const { records } = useCredentials()

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

  const goToDetails = (credentialRecordId: string) => {
    navigation.navigate('CredentialDetails', { credentialRecordId })
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.subContainer}>
        <FlatList
          showsVerticalScrollIndicator={false}
          data={credentials}
          renderItem={({ item: credential }) => (
            <CardCredentialMainInformation
              credentialMainInfo={credential}
              onPress={() => goToDetails(credential.recordId)}
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
    </SafeAreaView>
  )
}

export default Wallet
