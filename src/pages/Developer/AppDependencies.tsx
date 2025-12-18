import React, { useEffect, useState } from 'react'
import { View, FlatList, StyleSheet } from 'react-native'

import packageJson from '../../../package.json'

import { Text } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { AppTheme } from '@2060/styles'
import { hexTransparency } from '@2060/utils/colorUtils'

interface Dependency {
  name: string
  version: string
}

const AppDependencies = () => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const [dependencies, setDependencies] = useState<Dependency[]>([])
  const [devDependencies, setDevDependencies] = useState<Dependency[]>([])

  useEffect(() => {
    const deps: Dependency[] = []
    const devDeps: Dependency[] = []

    Object.entries(packageJson.dependencies).forEach(([name, version]) => {
      deps.push({ name, version: version as string })
    })

    Object.entries(packageJson.devDependencies).forEach(([name, version]) => {
      devDeps.push({ name, version: version as string })
    })

    setDependencies(deps.sort((a, b) => a.name.localeCompare(b.name)))
    setDevDependencies(devDeps.sort((a, b) => a.name.localeCompare(b.name)))
  }, [])

  const renderItem = ({ item }: { item: Dependency }) => (
    <View style={styles.item}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.version}>{item.version}</Text>
    </View>
  )

  return (
    <View style={styles.container}>
      <Text fontFamily="EuclidCircularA-Medium" style={styles.title}>
        App Dependencies
      </Text>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dependencies ({dependencies.length})</Text>
        </View>
        <FlatList
          data={dependencies}
          renderItem={renderItem}
          keyExtractor={item => item.name}
          scrollEnabled={false}
        />
      </View>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dev Dependencies ({devDependencies.length})</Text>
        </View>
        <FlatList
          data={devDependencies}
          renderItem={renderItem}
          keyExtractor={item => item.name}
          scrollEnabled={false}
        />
      </View>
    </View>
  )
}

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      marginTop: 20,
    },
    title: {
      textAlign: 'center',
      fontSize: theme.fontSize.lg,
      marginVertical: 10,
      color: theme.colors.primaryText,
    },
    section: {
      marginBottom: 24,
    },
    sectionHeader: {
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: hexTransparency('#6A8994', '29'),
    },
    sectionTitle: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.md2,
    },
    item: {
      flex: 1,
      flexDirection: 'row',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: hexTransparency('#6A8994', '29'),
    },
    name: {
      fontSize: theme.fontSize.md,
      color: theme.colors.primaryText,
      flex: 8,
    },
    version: {
      fontSize: theme.fontSize.md,
      color: theme.colors.primaryText,
      flex: 2,
      textAlign: 'right',
    },
  })

export default AppDependencies
