import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const Image: React.FC<SvgProps> = props => (
  <Svg width={30} height={30} viewBox="0 0 30 30" {...props}>
    <Path data-name="Path 581" d="M0 0h30v30H0Z" fill="none" />
    <Path
      data-name="Path 582"
      d="M27 24.333V5.667A2.675 2.675 0 0 0 24.333 3H5.667A2.675 2.675 0 0 0 3 5.667v18.666A2.675 2.675 0 0 0 5.667 27h18.666A2.675 2.675 0 0 0 27 24.333ZM10.867 17.64l2.8 3.373 4.133-5.32a.669.669 0 0 1 1.067.013l4.68 6.24a.666.666 0 0 1-.533 1.067H7.027a.664.664 0 0 1-.52-1.08l3.32-4.267a.658.658 0 0 1 1.04-.026Z"
      fill={props.fill}
    />
  </Svg>
)

export default Image
