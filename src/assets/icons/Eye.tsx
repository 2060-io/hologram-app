import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const Eye: React.FC<SvgProps> = (props) => (
  <Svg viewBox="0 0 22 15" {...props}>
    <Path
      data-name="Trazado 658"
      d="M12 4a11.827 11.827 0 00-11 7.5 11.817 11.817 0 0022 0A11.827 11.827 0 0012 4zm0 12.5a5 5 0 115-5 5 5 0 01-5 5zm0-8a3 3 0 103 3 3 3 0 00-3-3z"
      transform="translate(-1 -4)"
      fill={props.fill}
    />
  </Svg>
)

export default Eye
