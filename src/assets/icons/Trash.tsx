import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const Trash: React.FC<SvgProps> = (props) => (
  <Svg viewBox="0 0 22 22" {...props}>
    <Path data-name="Trazado 599" d="M0 0h24v24H0z" fill="none" />
    <Path
      data-name="Trazado 600"
      d="M6 19a2.006 2.006 0 002 2h8a2.006 2.006 0 002-2V9a2.006 2.006 0 00-2-2H8a2.006 2.006 0 00-2 2zM18 4h-2.5l-.71-.71a1.009 1.009 0 00-.7-.29H9.91a1.009 1.009 0 00-.7.29L8.5 4H6a1 1 0 000 2h12a1 1 0 000-2z"
      fill={props.fill}
    />
  </Svg>
)

export default Trash
