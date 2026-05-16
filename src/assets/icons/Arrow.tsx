import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const Arrow: React.FC<SvgProps> = (props) => (
  <Svg width={6.585} height={11.166} viewBox="0 0 6.585 11.166" {...props}>
    <Path
      data-name="Trazado 459"
      d="M9.31 6.71a1 1 0 000 1.41L13.19 12l-3.88 3.88a1 1 0 001.41 1.41l4.59-4.59a1 1 0 000-1.41L10.72 6.7a1 1 0 00-1.41.01z"
      transform="translate(-9.017 -6.416)"
      fill={props.fill}
    />
  </Svg>
)

export default Arrow
