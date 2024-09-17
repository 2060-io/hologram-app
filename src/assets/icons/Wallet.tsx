import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const Wallet: React.FC<SvgProps> = props => (
  <Svg viewBox="0 0 18.54 17.54" {...props}>
    <Path
      data-name="Path 336"
      d="M9.831 15.668v-7.8a1.95 1.95 0 011.952-1.949h8.782v-.97A1.956 1.956 0 0018.613 3H4.952A1.95 1.95 0 003 4.949v13.642a1.95 1.95 0 001.952 1.949h13.661a1.956 1.956 0 001.952-1.949v-.974h-8.783a1.95 1.95 0 01-1.951-1.949zm2.927-7.8a.978.978 0 00-.976.974v5.847a.978.978 0 00.976.974h8.782v-7.8zm2.927 5.359a1.462 1.462 0 111.464-1.462 1.461 1.461 0 01-1.464 1.467z"
      transform="translate(-3 -3)"
      fill={props.fill}
    />
  </Svg>
)

export default Wallet
