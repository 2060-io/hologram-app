import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const Users: React.FC<SvgProps> = (props) => (
  <Svg width={23.54} height={23.54} viewBox="0 0 23.54 23.54" {...props}>
    <Path data-name="Path 557" d="M0 0h23.54v23.54H0Z" fill="none" />
    <Path
      data-name="Path 558"
      d="M15.686 10.8a2.9 2.9 0 1 0-2.937-2.9 2.907 2.907 0 0 0 2.937 2.9Zm-7.833 0a2.9 2.9 0 1 0-2.937-2.9 2.907 2.907 0 0 0 2.938 2.9Zm0 1.934C5.572 12.737 1 13.869 1 16.122v1.451a.976.976 0 0 0 .979.967h11.749a.976.976 0 0 0 .979-.967v-1.451c0-2.253-4.572-3.385-6.853-3.385Zm7.833 0c-.284 0-.607.019-.95.048.02.01.029.029.039.039a4.013 4.013 0 0 1 1.89 3.3v1.451a2.874 2.874 0 0 1-.176.967h5.072a.976.976 0 0 0 .979-.967v-1.45c0-2.253-4.572-3.385-6.854-3.385Z"
      fill={props.fill}
    />
  </Svg>
)

export default Users
