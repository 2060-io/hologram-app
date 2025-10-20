import React from 'react'
import { Trans } from 'react-i18next'
import { StyleProp, TextStyle } from 'react-native'

import Text from '../Text'

type Props = {
  style: StyleProp<TextStyle>
  kidAge: number
  userName: string | undefined
}

const ConnectionRefusedByAge = ({ style, kidAge, userName }: Props) => {
  return (
    <Trans
      i18nKey="invitation.connectionRefusedByAge"
      style={style}
      parent={Text}
      components={{
        bold: <Text typography="EuclidCircularA-Bold" style={style} />,
      }}
      values={{ age: kidAge, name: userName }}
    />
  )
}

export default ConnectionRefusedByAge
