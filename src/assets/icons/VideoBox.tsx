import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const VideoBox: React.FC<SvgProps> = props => (
  <Svg viewBox="0 0 24 24" {...props}>
    <Path
      data-name="Trazado 668"
      d="M20 2H4a2 2 0 00-1.99 2L2 22l4-4h14a2.006 2.006 0 002-2V4a2.006 2.006 0 00-2-2zm-3.62 10.7L14 10.8V13a1 1 0 01-1 1H7a1 1 0 01-1-1V7a1 1 0 011-1h6a1 1 0 011 1v2.2l2.38-1.9a1 1 0 011.62.78v3.84a1 1 0 01-1.62.78z"
      transform="translate(-2 -2)"
      fill={props.fill}
    />
  </Svg>
)

export default VideoBox
