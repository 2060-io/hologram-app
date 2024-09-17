import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const Block: React.FC<SvgProps> = props => (
  <Svg viewBox="0 0 24 24" {...props}>
    <Path data-name="Path 596" d="M0 0h24v24H0z" fill="none" />
    <Path
      data-name="Path 597"
      d="M12 2a10 10 0 1010 10A10 10 0 0012 2zM4 12a8 8 0 018-8 7.9 7.9 0 014.9 1.69L5.69 16.9A7.9 7.9 0 014 12zm8 8a7.9 7.9 0 01-4.9-1.69L18.31 7.1A7.9 7.9 0 0120 12a8 8 0 01-8 8z"
      fill={props.fill}
    />
  </Svg>
)

export default Block
