import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const Add: React.FC<SvgProps> = (props) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" {...props}>
    <Path data-name="Path 362" d="M0 0h24v24H0Z" fill="none" />
    <Path
      data-name="Path 363"
      d="M18 13h-5v5a1 1 0 0 1-2 0v-5H6a1 1 0 0 1 0-2h5V6a1 1 0 0 1 2 0v5h5a1 1 0 0 1 0 2Z"
      fill={props.fill}
    />
  </Svg>
)

export default Add
