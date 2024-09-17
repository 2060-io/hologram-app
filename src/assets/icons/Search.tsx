import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const Search: React.FC<SvgProps> = props => (
  <Svg id="search_black_24dp" viewBox="0 0 24 24" {...props}>
    <Path id="Path_406" data-name="Path 406" d="M0,0H24V24H0Z" fill="none" />
    <Path
      id="Path_407"
      data-name="Path 407"
      d="M15.5,14h-.79l-.28-.27a6.518,6.518,0,1,0-.7.7l.27.28v.79l4.25,4.25a1.054,1.054,0,0,0,1.49-1.49Zm-6,0A4.5,4.5,0,1,1,14,9.5,4.494,4.494,0,0,1,9.5,14Z"
      fill={props.fill}
    />
  </Svg>
)
export default Search
