import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const Minimize: React.FC<SvgProps> = props => (
  <Svg
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke={props.fill}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
    fill="none"
  >
    <Path d="M0 0h24v24H0z" stroke="none" />
    <Path d="M18 10h-4V6M20 4l-6 6M6 14h4v4M10 14l-6 6" />
  </Svg>
)
export default Minimize
