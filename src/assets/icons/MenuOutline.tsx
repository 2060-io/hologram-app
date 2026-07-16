import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const MenuOutline: React.FC<SvgProps> = (props) => (
  <Svg width={17.12} height={10.7} viewBox="0 0 17.12 10.7" {...props}>
    <Path
      data-name="Trazado 409"
      d="M3.951 16.7h15.218a.894.894 0 100-1.783H3.951a.894.894 0 100 1.783zm0-4.458h15.218a.894.894 0 100-1.783H3.951a.894.894 0 100 1.783zM3 6.892a.926.926 0 00.951.892h15.218a.894.894 0 100-1.783H3.951A.926.926 0 003 6.892z"
      transform="translate(-3 -6)"
      fill={props.fill}
    />
  </Svg>
)

export default MenuOutline
