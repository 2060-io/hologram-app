import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const AddWallet: React.FC<SvgProps> = props => (
  <Svg width={19} height={19} viewBox="0 0 19 19" {...props}>
    <Path
      fill={props.fill}
      d="M.95 3.8a.953.953 0 0 0-.95.95V17.1A1.906 1.906 0 0 0 1.9 19h12.35a.95.95 0 0 0 0-1.9H2.85a.953.953 0 0 1-.95-.95V4.75a.953.953 0 0 0-.95-.95ZM17.1 0H5.7a1.906 1.906 0 0 0-1.9 1.9v11.4a1.906 1.906 0 0 0 1.9 1.9h11.4a1.906 1.906 0 0 0 1.9-1.9V1.9A1.906 1.906 0 0 0 17.1 0Zm-1.9 8.55h-2.85v2.85a.95.95 0 0 1-1.9 0V8.55H7.6a.95.95 0 0 1 0-1.9h2.85V3.8a.95.95 0 1 1 1.9 0v2.85h2.85a.95.95 0 1 1 0 1.9Z"
    />
  </Svg>
)

export default AddWallet
