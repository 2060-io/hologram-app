/* eslint-disable no-param-reassign */
// logging import and setup
import * as Mrz from 'mrz'

const TD1_LINE_LONG = 30
const TD2_LINE_LONG = 36
const TD3_LINE_LONG = 44

export const findAndParseMrz = (initialLines: string[]) => {
  let lines: string[] = []
  const firstInitialLastLine = initialLines[initialLines.length - 1]
  const secondInitialLastLine = initialLines[initialLines.length - 2]
  // if lines.length >= 2, extract and parse two-line MRZ
  if (initialLines && initialLines.length >= 2 && firstInitialLastLine && secondInitialLastLine) {
    // return undefined if a double left angle bracket character is
    // found in either last line, or second to last line.
    if (firstInitialLastLine.indexOf('«') !== -1 || secondInitialLastLine.indexOf('«') !== -1) {
      return undefined
    }
    // remove all empty spaces in each line, capitalize all letters, change all '$' to 'S' and « to <
    initialLines.forEach((line: string) => {
      while (line.indexOf(' ') !== -1) {
        line = line.replace(' ', '')
      }
      line = line.toUpperCase()
      while (line.indexOf('$') !== -1) {
        line = line.replace('$', 'S')
      }
      while (line.indexOf('«') !== -1) {
        line = line.replace('«', '<')
      }
      // MLKIT sometimes add a new line character when it finds a new line instead of
      // separating the lines into different elements.
      while (line.indexOf('\n') !== -1) {
        lines.push(line.substring(0, line.indexOf('\n')))
        line = line.substring(line.indexOf('\n') + 1)
      }
      lines.push(line)
    })

    // parse 2 line MRZ if the current line, and the previous line both have 44 characters (TD3)
    // or 36 characters (TD2) or visas
    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i]
      const lastLine = lines[i - 1]
      if (currentLine && lastLine) {
        if (
          (currentLine.length === TD3_LINE_LONG && lastLine.length === TD3_LINE_LONG) ||
          (currentLine.length === TD2_LINE_LONG && lastLine.length === TD2_LINE_LONG)
        ) {
          const parseResult = Mrz.parse([lastLine, currentLine])
          if (['TD2', 'TD3'].includes(parseResult.format)) {
            return { lines: [lastLine, currentLine], fields: parseResult.fields }
          }
        }
      }
    }
  } // end (lines.length >= 2)
  // if its a TD1 (ID cards)
  if (lines.length >= 3) {
    // At this point, empty spaces will already be removed and all letters will be capitalized.
    // return undefined if a double left angle bracket character is found in third to last line.
    const thirdToLastLine = lines[lines.length - 3]
    if (thirdToLastLine && thirdToLastLine.indexOf('«') !== -1) {
      return undefined
    }
    for (let i = 2; i < lines.length; i++) {
      const currentLine = lines[i]
      const lastLine = lines[i - 1]
      const secondToLastLine = lines[i - 2]
      if (currentLine && lastLine && secondToLastLine) {
        if (
          currentLine.length === TD1_LINE_LONG &&
          lastLine.length === TD1_LINE_LONG &&
          secondToLastLine.length === TD1_LINE_LONG
        ) {
          const parseResult = Mrz.parse([secondToLastLine, lastLine, currentLine])
          if (parseResult.format === 'TD1') {
            return { lines: [secondToLastLine, lastLine, currentLine], fields: parseResult.fields }
          }
        }
      }
    }
  } // end (lines.length >= 3)
  return undefined
}
