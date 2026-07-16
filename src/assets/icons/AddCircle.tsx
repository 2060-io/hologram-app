import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const AddCircle: React.FC<SvgProps> = (props) => (
  <Svg width={17.12} height={17.12} viewBox="0 0 17.12 17.12" {...props}>
    <Path
      data-name="Trazado 405"
      d="M10.56 6.28a.859.859 0 00-.856.856V9.7H7.136a.856.856 0 100 1.712H9.7v2.568a.856.856 0 001.712 0v-2.564h2.568a.856.856 0 000-1.712h-2.564V7.136a.859.859 0 00-.856-.856zm0-4.28a8.56 8.56 0 108.56 8.56A8.563 8.563 0 0010.56 2zm0 15.408a6.848 6.848 0 116.848-6.848 6.857 6.857 0 01-6.848 6.848z"
      transform="translate(-2 -2)"
      fill={props.fill}
    />
  </Svg>
)

export default AddCircle
