import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const Scan: React.FC<SvgProps> = props => (
  <Svg viewBox="0 0 20 20" {...props}>
    <Path
      data-name="Trazado 431"
      d="M9.5 6.5v3h-3v-3h3M11 5H5v6h6V5zm-1.5 9.5v3h-3v-3h3M11 13H5v6h6v-6zm6.5-6.5v3h-3v-3h3M19 5h-6v6h6V5zm-6 8h1.5v1.5H13zm1.5 1.5H16V16h-1.5zM16 13h1.5v1.5H16zm-3 3h1.5v1.5H13zm1.5 1.5H16V19h-1.5zM16 16h1.5v1.5H16zm1.5-1.5H19V16h-1.5zm0 3H19V19h-1.5zM21 7a1 1 0 01-1-1V4h-2a1 1 0 01-1-1 1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1zm1 14v-3a1 1 0 00-1-1 1 1 0 00-1 1v2h-2a1 1 0 00-1 1 1 1 0 001 1h3a1 1 0 001-1zM3 22h3a1 1 0 001-1 1 1 0 00-1-1H4v-2a1 1 0 00-1-1 1 1 0 00-1 1v3a1 1 0 001 1zM2 3v3a1 1 0 001 1 1 1 0 001-1V4h2a1 1 0 001-1 1 1 0 00-1-1H3a1 1 0 00-1 1z"
      transform="translate(-2 -2)"
      fill={props.fill}
    />
  </Svg>
)

export default Scan
