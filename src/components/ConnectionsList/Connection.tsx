import React, { memo } from 'react'
import { View, TouchableOpacity } from 'react-native'

import Avatar from '../common/Avatar'
import RadioButton from '../common/RadioButton'

import { ConnectionItem } from './ConnectionListProps'
import getStyles from './styles'

import SvgIcon from '@2060/components/common/SvgIcon'
import Text from '@2060/components/common/Text'
import VerifiedIcon from '@2060/components/common/VerifiedIcon'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'

type Props = {
  onPress: () => void
  onPressRightSide: () => void
  connection: ConnectionItem
  isSearchingMode: boolean
  allowSelection?: boolean
  isSelected: boolean
  isLastInSection: boolean
}

const Connection = ({
  onPress,
  onPressRightSide,
  connection,
  isSearchingMode,
  allowSelection,
  isSelected,
  isLastInSection,
}: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  return (
    <TouchableOpacity
      key={connection.id}
      style={[styles.containerConnection, isLastInSection && { paddingBottom: 0 }]}
      onPress={onPress}
    >
      {connection.isService && connection.status && (
        <VerifiedIcon style={styles.containerVerifiedMark} status={connection.status} />
      )}
      <Avatar
        uri={connection.avatarUrl}
        label={connection.name}
        size="8.41%"
        bgAvatarInitials={theme.colors.secondary}
        enableImageRefresh={false}
      />
      <Text typography="EuclidCircularA-Medium" style={styles.listItemText}>
        {connection.name}{' '}
        {!!connection.subConnections.length && !isSearchingMode && (
          <Text style={styles.numberSubConnect}>{`(+${connection.subConnections.length})`}</Text>
        )}
      </Text>
      {!!connection.subConnections.length && (
        <TouchableOpacity onPress={onPressRightSide} style={styles.rightSideContainer}>
          {!!connection.subConnectionsThatMatchWithSearch && (
            <View style={styles.connectionsMatchedContainer}>
              <Text typography="EuclidCircularA-Medium" style={styles.connectionsMatchedText}>
                {connection.subConnectionsThatMatchWithSearch}
              </Text>
            </View>
          )}
          <SvgIcon name="chevronForward" fill={theme.colors.primaryText} />
        </TouchableOpacity>
      )}
      {allowSelection && <RadioButton style={styles.radioButton} isChecked={isSelected} />}
    </TouchableOpacity>
  )
}

export default memo(Connection)
