import { Avatar, SvgIcon, Text, VerifiedIcon } from '@src/components/common'
import { useFetchServiceInfo } from '@src/hooks'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { log } from '@src/utils'
import React, { memo } from 'react'
import { TouchableOpacity, View } from 'react-native'
import { ConnectionItem } from './ConnectionListProps'
import getStyles from './styles'

type Props = {
  onPress: () => void
  onPressRightSide: () => void
  connection: ConnectionItem
  isSearchingMode: boolean
  isSelected: boolean
  isLastInSection: boolean
}

const Connection = ({ onPress, onPressRightSide, connection, isSearchingMode, isSelected, isLastInSection }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  log('connection.invitationDid', connection.invitationDid, ' isService: ', connection.isService)
  const { serviceInfo } = useFetchServiceInfo({
    did: connection.invitationDid && connection.isService ? connection.invitationDid : undefined,
    forceFetchIfNotInCache: false,
  })
  const name = serviceInfo?.name ?? connection.name
  const avatarUrl = serviceInfo?.logoUrl ?? connection.avatarUrl

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
        uri={avatarUrl}
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
