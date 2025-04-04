import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const Forward: React.FC<SvgProps> = props => (
  <Svg viewBox="0 0 17.593 13.594" {...props}>
    <Path
      d="M14.408 9V7.41a1 1 0 011.71-.71l4.59 4.59a1 1 0 010 1.41l-4.59 4.59a1 1 0 01-1.71-.7V14.9c-5 0-8.5 1.6-11 5.1 1-5 4-10 11-11z"
      transform="translate(-3.408 -6.406)"
      fill={props.fill}
    />
  </Svg>
)

export default Forward
