import React from 'react'
import Svg, { Defs, G, Path, SvgProps } from 'react-native-svg'

const PlayCircle: React.FC<SvgProps> = (props) => (
  <Svg width={70} height={70} viewBox="0 0 70 70" {...props}>
    <Defs />
    <G filter="url(#a)">
      <Path
        data-name="play_circle_outline_black_24dp"
        d="m31.88 42.14 12.142-9.1a1.29 1.29 0 0 0 0-2.08l-12.142-9.1a1.3 1.3 0 0 0-2.08 1.04v18.2a1.3 1.3 0 0 0 2.08 1.04ZM35 6a26 26 0 1 0 26 26A26.009 26.009 0 0 0 35 6Zm0 46.8A20.8 20.8 0 1 1 55.8 32 20.828 20.828 0 0 1 35 52.8Z"
        fill={props.fill}
      />
    </G>
  </Svg>
)

export default PlayCircle
