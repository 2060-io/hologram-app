import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const Phone: React.FC<SvgProps> = (props) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" {...props}>
    <Path data-name="Path 585" d="M0 0h24v24H0Z" fill="none" />
    <Path
      data-name="Path 586"
      d="m19.23 15.26-2.54-.29a1.991 1.991 0 0 0-1.64.57l-1.84 1.84a15.045 15.045 0 0 1-6.59-6.59l1.85-1.85a1.991 1.991 0 0 0 .57-1.64l-.29-2.52a2 2 0 0 0-1.99-1.77H5.03a1.985 1.985 0 0 0-2 2.07 16.992 16.992 0 0 0 15.89 15.89 1.985 1.985 0 0 0 2.07-2v-1.73a1.982 1.982 0 0 0-1.76-1.98Z"
      fill={props.fill}
    />
  </Svg>
)

export default Phone
