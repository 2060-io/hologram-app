import React, { memo } from 'react'

import SvgIcon, { IconsNames } from '../SvgIcon'

import { ChatEntryState } from '@src/model'
import { AppTheme } from '@src/styles'

type Props = { theme: AppTheme; state: ChatEntryState }

const chatEntryStateIconNames: Partial<Record<ChatEntryState, keyof IconsNames>> = {
  [ChatEntryState.Created]: 'pending',
  [ChatEntryState.Submitted]: 'singleCheckMark',
  [ChatEntryState.Received]: 'doubleCheckMark',
  [ChatEntryState.Viewed]: 'doubleCheckMarkFilled',
}

const iconSizeByState: Partial<Record<ChatEntryState, Record<string, unknown>>> = {
  [ChatEntryState.Created]: { width: 13.51, height: 13.51 },
  [ChatEntryState.Submitted]: { width: 13.51, height: 13.51 },
  [ChatEntryState.Received]: { width: 16.84, height: 13.51 },
  [ChatEntryState.Viewed]: { width: 16.84, height: 13.51 },
}

const MessageStateIcon = ({ theme, state }: Props) => (
  <SvgIcon
    name={chatEntryStateIconNames[state] as keyof IconsNames}
    fill={theme.isDarkMode ? '#9CB1B7' : '#6A8994'}
    {...iconSizeByState[state]}
  />
)

export default memo(MessageStateIcon)
