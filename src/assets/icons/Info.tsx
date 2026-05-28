import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const Info: React.FC<SvgProps> = (props) => (
  <Svg width={17.12} height={17.12} viewBox="0 0 17.12 17.12" {...props}>
    <Path
      data-name="Path 850"
      d="M7.7 4.28h1.712v1.712H7.7Zm0 3.42h1.712v5.14H7.7ZM8.56 0a8.56 8.56 0 1 0 8.56 8.56A8.563 8.563 0 0 0 8.56 0Zm0 15.408a6.848 6.848 0 1 1 6.848-6.848 6.857 6.857 0 0 1-6.848 6.848Z"
      fill={props.fill}
    />
  </Svg>
)

export default Info
