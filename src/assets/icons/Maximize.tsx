import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const Maximize: React.FC<SvgProps> = (props) => (
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
    <Path d="M3 17a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1zM4 12V6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2h-6" />
    <Path d="M12 8h4v4M16 8l-5 5" />
  </Svg>
)

export default Maximize
