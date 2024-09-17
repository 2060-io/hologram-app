import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const Archive: React.FC<SvgProps> = props => (
  <Svg width={17.12} height={17.12} viewBox="0 0 17.12 17.12" {...props}>
    <Path
      data-name="Trazado 478"
      d="M15.364 8.707h-2.425V5.853h-2.758v2.854H7.756l3.8 3.8zM18.218 3H4.893A1.894 1.894 0 003 4.9v13.318a1.894 1.894 0 001.893 1.9h13.325a1.908 1.908 0 001.9-1.9V4.9a1.908 1.908 0 00-1.9-1.9zm0 15.218H4.9v-2.854h3.388a3.781 3.781 0 006.563 0h3.367zm0-4.756h-4.746a1.9 1.9 0 11-3.8 0H4.9L4.893 4.9h13.325z"
      transform="translate(-3 -3)"
      fill={props.fill}
    />
  </Svg>
)

export default Archive
