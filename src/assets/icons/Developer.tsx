import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const Developer: React.FC<SvgProps> = props => (
  <Svg
    viewBox="0 0 24 24"
    strokeWidth={2.5}
    stroke={props.fill}
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="M0 0h24v24H0z" stroke="none" />
    <Path d="M12 15H5.5a2.5 2.5 0 110-5H6M15 12v6.5a2.5 2.5 0 11-5 0V18M12 9h6.5a2.5 2.5 0 110 5H18M9 12V5.5a2.5 2.5 0 015 0V6" />
  </Svg>
)

export default Developer
