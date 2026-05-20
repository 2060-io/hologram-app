import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const FilterOutline: React.FC<SvgProps> = (props) => (
  <Svg width={23.54} height={23.54} viewBox="0 0 23.54 23.54" {...props}>
    <Path data-name="Path 408" d="M0 0h23.54v23.54H0Z" fill="none" />
    <Path
      data-name="Path 409"
      d="M9.918 16.47H13.1a.894.894 0 1 0 0-1.783H9.918a.894.894 0 1 0 0 1.783Zm-3.015-4.458h9.207a.894.894 0 1 0 0-1.783H6.903a.894.894 0 1 0 0 1.783ZM3.04 6.662a.926.926 0 0 0 .951.892h15.054a.894.894 0 1 0 0-1.783H3.991a.926.926 0 0 0-.951.891Z"
      fill={props.fill}
    />
  </Svg>
)

export default FilterOutline
