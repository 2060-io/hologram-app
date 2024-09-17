import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const ArrowForward: React.FC<SvgProps> = props => (
  <Svg width={24} height={24} viewBox="0 0 24 24" {...props}>
    <Path data-name="Rectangle 4082" fill="none" d="M0 0h24v24H0z" />
    <Path
      data-name="Path 656"
      d="M14.29 5.71a1 1 0 0 0 0 1.41L18.17 11H3a1 1 0 0 0-1 1 1 1 0 0 0 1 1h15.18l-3.88 3.88a1 1 0 0 0 0 1.41 1 1 0 0 0 1.41 0l5.59-5.59a1 1 0 0 0 0-1.41l-5.6-5.58a1 1 0 0 0-1.41 0Z"
      fill={props.fill}
    />
  </Svg>
)

export default ArrowForward
