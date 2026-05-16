import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const Archived: React.FC<SvgProps> = (props) => (
  <Svg width={19.54} height={19.54} viewBox="0 0 19.54 19.54" {...props}>
    <Path
      data-name="Trazado 440"
      d="M19.586 2H3.954A2.026 2.026 0 002 3.954v2.941a1.974 1.974 0 00.977 1.651v11.04a2.1 2.1 0 001.954 1.954h13.678a2.1 2.1 0 001.954-1.954V8.546a1.974 1.974 0 00.977-1.651V3.954A2.026 2.026 0 0019.586 2zm-5.862 11.724H9.816a.98.98 0 01-.977-.977.98.98 0 01.977-.977h3.908a.98.98 0 01.977.977.98.98 0 01-.977.977zm5.862-6.839H3.954V3.954h15.632z"
      transform="translate(-2 -2)"
      fill={props.fill}
    />
  </Svg>
)

export default Archived
