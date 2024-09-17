import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const Done: React.FC<SvgProps> = props => (
  <Svg data-name="check_circle_black_24dp (1)" viewBox="0 0 64.2 64.2" {...props}>
    <Path data-name="Trazado 639" d="M0 0h64.2v64.2H0z" fill="none" />
    <Path
      data-name="Trazado 640"
      d="M32.1 2a30.1 30.1 0 1030.1 30.1A30.111 30.111 0 0032.1 2zm-8.157 43.013L13.137 34.207a3 3 0 014.244-4.244l8.7 8.669 20.708-20.709a3 3 0 114.244 4.244L28.187 45.013a3 3 0 01-4.244 0z"
      fill={props.fill}
    />
  </Svg>
)

export default Done
