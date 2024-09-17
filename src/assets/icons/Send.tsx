import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const Send: React.FC<SvgProps> = props => (
  <Svg width={24} height={24} viewBox="0 0 24 24" {...props}>
    <Path data-name="Path 364" d="M0 0h24v24H0Z" fill="none" />
    <Path
      data-name="Path 365"
      d="m3.4 20.4 17.45-7.48a1 1 0 0 0 0-1.84L3.4 3.6a.993.993 0 0 0-1.39.91L2 9.12a.994.994 0 0 0 .87.99L17 12 2.87 13.88a1.012 1.012 0 0 0-.87 1l.01 4.61a.993.993 0 0 0 1.39.91Z"
      fill={props.fill}
    />
  </Svg>
)

export default Send
