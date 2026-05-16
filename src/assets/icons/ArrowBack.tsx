import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const ArrowBack: React.FC<SvgProps> = (props) => (
  <Svg id="arrow_back_black_24dp_1_" data-name="arrow_back_black_24dp (1)" viewBox="0 0 24 24" {...props}>
    <Path id="Path_429" data-name="Path 429" d="M0,0H24V24H0Z" fill="none" />
    <Path
      id="Path_430"
      data-name="Path 430"
      d="M19,11H7.83l4.88-4.88a1.008,1.008,0,0,0,0-1.42,1,1,0,0,0-1.41,0L4.71,11.29a1,1,0,0,0,0,1.41l6.59,6.59a1,1,0,0,0,1.41-1.41L7.83,13H19a1,1,0,0,0,0-2Z"
      fill={props.fill}
    />
  </Svg>
)

export default ArrowBack
