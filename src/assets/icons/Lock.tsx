import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

const Lock: React.FC<SvgProps> = (props) => (
  <Svg width={52.688} height={52.688} viewBox="0 0 52.688 52.688" {...props}>
    <G data-name="Group 1841" fill="none">
      <Path data-name="Path 611" d="M0 0h52.688v52.688H0Z" />
      <Path data-name="Path 612" d="M0 0h52.688v52.688H0Z" opacity={0.87} />
    </G>
    <Path
      data-name="Path 613"
      d="M39.516 17.562h-2.2v-4.39a10.977 10.977 0 1 0-21.953 0v4.391h-2.2a4.4 4.4 0 0 0-4.382 4.39v21.953a4.4 4.4 0 0 0 4.391 4.389h26.344a4.4 4.4 0 0 0 4.391-4.391V21.953a4.4 4.4 0 0 0-4.391-4.391ZM26.344 37.32a4.391 4.391 0 1 1 4.391-4.391 4.4 4.4 0 0 1-4.391 4.391Zm-6.586-19.758v-4.39a6.586 6.586 0 1 1 13.172 0v4.391Z"
      fill={props.fill}
    />
  </Svg>
)

export default Lock
