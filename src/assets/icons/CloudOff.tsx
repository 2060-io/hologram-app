import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const CloudOff: React.FC<SvgProps> = (props) => (
  <Svg viewBox="0 0 23.54 23.54" {...props}>
    <Path data-name="Trazado 674" d="M0 0h23.54v23.54H0z" fill="none" />
    <Path
      data-name="Trazado 675"
      d="M23.54 15a4.936 4.936 0 00-4.561-4.96A7.384 7.384 0 0011.77 4a7.145 7.145 0 00-3.58.97l1.461 1.49A5.206 5.206 0 0111.77 6a5.445 5.445 0 015.395 5.5v.5h1.471a2.968 2.968 0 012.942 3 3.011 3.011 0 01-1.187 2.4l1.383 1.41A5 5 0 0023.54 15zM3.639 4.56a1.01 1.01 0 000 1.41l2.02 2.06h-.412a5.966 5.966 0 00-5.188 6.79A6.06 6.06 0 006.1 20h11.29l1.265 1.29a.964.964 0 001.383 0 1.01 1.01 0 000-1.41L5.022 4.56a.964.964 0 00-1.383 0zM5.885 18a4 4 0 010-8h1.7l7.847 8z"
      transform="translate(0 -.46)"
      fill={props.fill}
    />
  </Svg>
)

export default CloudOff
