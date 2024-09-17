import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

const PersonRemove: React.FC<SvgProps> = props => (
  <Svg viewBox="0 0 24 24" {...props}>
    <G data-name="Group 1492" fill="none">
      <Path data-name="Rectangle 1019" d="M0 0H24V24H0z" />
      <Path data-name="Rectangle 1020" d="M0 0H24V24H0z" />
    </G>
    <G data-name="Group 1493">
      <Path
        data-name="Path 598"
        d="M14 8a4 4 0 10-4 4 4 4 0 004-4zM2 18v1a1 1 0 001 1h14a1 1 0 001-1v-1c0-2.66-5.33-4-8-4s-8 1.34-8 4zm16-8h4a1 1 0 011 1 1 1 0 01-1 1h-4a1 1 0 01-1-1 1 1 0 011-1z"
        fill={props.fill}
      />
    </G>
  </Svg>
)

export default PersonRemove
