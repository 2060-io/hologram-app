import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const Messages: React.FC<SvgProps> = props => (
  <Svg viewBox="0 0 20 20" {...props}>
    <Path
      data-name="Trazado 332"
      d="M20 2H4a2.006 2.006 0 00-2 2v18l4-4h14a2.006 2.006 0 002-2V4a2.006 2.006 0 00-2-2z"
      transform="translate(-2 -2)"
      fill={props.fill}
    />
  </Svg>
)

export default Messages
