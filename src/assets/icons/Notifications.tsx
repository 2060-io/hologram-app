import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const Notifications: React.FC<SvgProps> = (props) => (
  <Svg width={23.54} height={23.54} viewBox="0 0 23.54 23.54" {...props}>
    <Path data-name="Path 551" d="M0 0h23.54v23.54H0Z" fill="none" />
    <Path
      data-name="Path 552"
      d="M11.77 21.54a1.952 1.952 0 0 0 1.939-1.953H9.831a1.946 1.946 0 0 0 1.939 1.953Zm5.818-5.858V10.8c0-3-1.59-5.507-4.364-6.171v-.664a1.455 1.455 0 1 0-2.909 0v.664c-2.783.664-4.363 3.163-4.363 6.171v4.882L4.7 16.941a.977.977 0 0 0 .679 1.67H18.15a.98.98 0 0 0 .688-1.67Z"
      fill={props.fill}
    />
  </Svg>
)

export default Notifications
