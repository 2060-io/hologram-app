import React, { memo } from 'react'
import { View, TouchableOpacity } from 'react-native'

import { ConnectionItem } from './ConnectionListProps'
import getStyles from './styles'

import { Avatar, SvgIcon, Text, VerifiedIcon } from '@2060/components/common'
import { useFetchServiceInfo } from '@2060/hooks'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'

type Props = {
  onPress: () => void
  onPressRightSide: () => void
  connection: ConnectionItem
  isSearchingMode: boolean
  isSelected: boolean
  isLastInSection: boolean
}

const Connection = ({
  onPress,
  onPressRightSide,
  connection,
  isSearchingMode,
  isSelected,
  isLastInSection,
}: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { serviceInfo } = useFetchServiceInfo(
    connection.invitationDid && connection.isService ? connection.invitationDid : undefined,
  )
  const name = serviceInfo?.name ?? connection.name
  const logoUrl = serviceInfo?.logoUrl ?? connection.avatarUrl

  return (
    <TouchableOpacity
      key={connection.id}
      style={[
        styles.containerConnection,
        isLastInSection && styles.lastConnectionInSection,
        isSelected && styles.selected,
      ]}
      onPress={onPress}
    >
      {connection.isService && connection.status && (
        <VerifiedIcon style={styles.containerVerifiedMark} status={connection.status} />
      )}
      <Avatar
        uri={logoUrl}
        label={name}
        size="8.41%"
        bgAvatarInitials={theme.colors.secondary}
        enableImageRefresh={false}
      />
      <Text fontFamily="EuclidCircularA-Medium" style={styles.listItemText}>
        {`${name} `}
        {!!connection.subConnections.length && !isSearchingMode && (
          <Text style={styles.numberSubConnect}>{`(+${connection.subConnections.length})`}</Text>
        )}
      </Text>
      {!!connection.subConnections.length && (
        <TouchableOpacity onPress={onPressRightSide} style={styles.rightSideContainer}>
          {!!connection.subConnectionsThatMatchWithSearch && (
            <View style={styles.connectionsMatchedContainer}>
              <Text fontFamily="EuclidCircularA-Medium" style={styles.connectionsMatchedText}>
                {connection.subConnectionsThatMatchWithSearch}
              </Text>
            </View>
          )}
          <SvgIcon name="chevronForward" fill={theme.colors.primaryText} />
        </TouchableOpacity>
      )}
      {isSelected && <SvgIcon name="done" fill={theme.colors.green} />}
    </TouchableOpacity>
  )
}

export default memo(Connection)
