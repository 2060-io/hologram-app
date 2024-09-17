import * as React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const Close: React.FC<SvgProps> = props => (
  <Svg viewBox="0 0 24 24" {...props}>
    <Path data-name="Path 605" d="M0 0h24v24H0Z" fill="none" />
    <Path
      data-name="Path 606"
      d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12 5.7 16.89a1 1 0 0 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 0 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4Z"
      fill={props.fill}
    />
  </Svg>
)

export default Close
