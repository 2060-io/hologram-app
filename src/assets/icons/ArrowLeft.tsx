import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const ArrowLeft: React.FC<SvgProps> = props => (
  <Svg width={15.583} height={15.175} viewBox="0 0 15.583 15.175" {...props}>
    <Path
      data-name="Trazado 430"
      d="M19 11H7.83l4.88-4.88a1.008 1.008 0 000-1.42 1 1 0 00-1.41 0l-6.59 6.59a1 1 0 000 1.41l6.59 6.59a1 1 0 001.41-1.41L7.83 13H19a1 1 0 000-2z"
      transform="translate(-4.418 -4.407)"
      fill={props.fill}
    />
  </Svg>
)

export default ArrowLeft
