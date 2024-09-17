import { useEffect, useState } from 'react'
import { Dimensions, ScaledSize } from 'react-native'

const { height: layoutHeight, width: layoutWidth } = Dimensions.get('screen')

type Orientation = 'PORTRAIT' | 'LANDSCAPE'

const getInitialState = (): Orientation => {
  return layoutHeight >= layoutWidth ? 'PORTRAIT' : 'LANDSCAPE'
}

const useOrientation = () => {
  const [orientation, setOrientation] = useState<Orientation>(getInitialState)

  const handleChangeDimensions = ({ screen }: { screen: ScaledSize }) => {
    const isLandscape = screen.width >= screen.height
    setOrientation(isLandscape ? 'LANDSCAPE' : 'PORTRAIT')
  }

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', handleChangeDimensions)
    return () => {
      subscription.remove()
    }
  }, [])

  return orientation
}

export default useOrientation
