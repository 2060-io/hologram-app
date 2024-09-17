import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const ChevronForward: React.FC<SvgProps> = props => (
  <Svg width={23.54} height={23.54} viewBox="0 0 23.54 23.54" {...props}>
    <Path data-name="Trazado 438" d="M23.54 23.54H0V0h23.54z" fill="none" opacity={0.87} />
    <Path
      data-name="Trazado 439"
      d="M7.38 20.559a1.272 1.272 0 001.77 0l8.31-8.106a.955.955 0 000-1.375L9.15 2.971a1.272 1.272 0 00-1.77 0 1.2 1.2 0 000 1.727l7.24 7.072-7.25 7.072a1.2 1.2 0 00.01 1.717z"
      transform="translate(-.243)"
      fill={props.fill}
    />
  </Svg>
)

export default ChevronForward
