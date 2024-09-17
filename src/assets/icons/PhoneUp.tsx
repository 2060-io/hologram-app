import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const PhoneUp: React.FC<SvgProps> = props => (
  <Svg viewBox="0 0 39.838 39.838" {...props}>
    <Path
      d="M19.268-.184C32.809-.313 39.907 9.394 38.353 12.03l-2.429 4.12a2.473 2.473 0 01-3.056 1.05c-3.412-1.394-8.363-3.6-5.128-9.529a17.566 17.566 0 00-8.529-1.75c-2.442.023-8.564 1.913-8.564 1.913 3.121 5.871-1.71 7.993-5.149 9.451a2.406 2.406 0 01-3.037-.992L.109 12.218C-1.513 9.41 6.065-.058 19.268-.184z"
      transform="rotate(-135 21.908 16.14)"
      fill={props.fill}
    />
  </Svg>
)

export default PhoneUp
