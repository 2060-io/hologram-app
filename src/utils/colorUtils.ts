/**
 * Assign transparency to a color.
 * @param {string} color the color in hexadecimal format, 6 characters.
 * @param {string} transparency - The transparency in letters from a - f, 2 characters.
 * @url https://gist.github.com/lopspower/03fb1cc0ac9f32ef38f4
 * @example
 * hexTransparency('#002337', 'ea');
 * // returns '#002337ea'
 * @returns {string} Returns the color with transparency in hexadecimal format, 8 characteres.
 */
export const hexTransparency = (color: string, transparency: string): string => `${color}${transparency}`

/**
 * Lighten or darken a color.
 * @param {string} color the color in hexadecimal format, 6 characters.
 * @param {number} quantity - number positive or negative.
 * @example
 * lightenDarken('#002337', -14);
 * // returns '#001529'
 * @returns {string} Returns the Lighten or darken color in hexadecimal format, 6 characteres.
 */
export const lightenDarken = (color: string, quantity: number = 0): string => {
  /* eslint-disable */
  color = color.slice(1)

  const num = parseInt(color, 16)

  let r = (num >> 16) + quantity
  r > 255 && (r = 255)
  r < 0 && (r = 0)

  let b = ((num >> 8) & 0x00ff) + quantity
  b > 255 && (b = 255)
  b < 0 && (b = 0)

  let g = (num & 0x0000ff) + quantity
  g > 255 && (g = 255)
  g < 0 && (g = 0)

  let result = (g | (b << 8) | (r << 16)).toString(16)

  for (let i = 0; result.length < 6; i++) {
    result = `0${result}`
  }
  /* eslint-enable */

  return `#${result}`
}

export const waterColor = (value: string) => hexTransparency(lightenDarken(value, 60), '20')
