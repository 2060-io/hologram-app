/* eslint-disable no-param-reassign */
// logging import and setup
import { parse } from 'mrz'

import { logWarn } from '@2060/utils'

const TD1_LINE_LONG = 30
const TD2_LINE_LONG = 36
const TD3_LINE_LONG = 44

export const findAndParseMrz = (initialLines: string[]) => {
  let lines: string[] = []
  // if lines.length >= 2, extract and parse two-line MRZ
  if (initialLines.length >= 2) {
    // MLKIT sometimes add a new line character when it finds a new line instead of
    // separating the lines into different elements.
    const preprocessedLines: string[] = []
    initialLines.forEach((line: string) => {
      while (line.indexOf('\n') !== -1) {
        preprocessedLines.push(line.substring(0, line.indexOf('\n')))
        line = line.substring(line.indexOf('\n') + 1)
      }
      preprocessedLines.push(line)
    })

    // remove all empty spaces in each line, capitalize all letters, change all '$' to 'S' and « to <
    preprocessedLines.forEach((line: string) => {
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

      if (line.endsWith('<') && line.length > TD1_LINE_LONG) {
        line.padEnd(TD3_LINE_LONG, '<')
      }

      if (line.length >= TD1_LINE_LONG && line.indexOf('<') !== -1) {
        lines.push(line)
      }
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
          const parseResult = parse([lastLine, currentLine], { autocorrect: true })
          if (parseResult.valid) {
            return { lines: [lastLine, currentLine], fields: parseResult.fields }
          } else {
            logWarn(
              `invalid passport: ${JSON.stringify(
                parseResult.details
                  .filter(item => item.valid === false)
                  .map(item => `${item.label}: ${item.error}`),
              )}`,
            )
          }
        }
      }
    }
  } // end (lines.length >= 2)
  // if its a TD1 (ID cards)
  if (lines.length >= 3) {
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
          const parseResult = parse([secondToLastLine, lastLine, currentLine], { autocorrect: true })
          if (parseResult.valid) {
            return { lines: [secondToLastLine, lastLine, currentLine], fields: parseResult.fields }
          } else {
            logWarn(
              `invalid passport: ${JSON.stringify(
                parseResult.details
                  .filter(item => item.valid === false)
                  .map(item => `${item.label}: ${item.error}`),
              )}`,
            )
          }
        }
      }
    }
  } // end (lines.length >= 3)
  return undefined
}
