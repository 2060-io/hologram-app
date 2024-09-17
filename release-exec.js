const verifyRelease = async (_, context) => {
  const fs = require('fs')

  fs.writeFileSync('.version', context.nextRelease.version)
  fs.writeFileSync('isNewRelease', (context.nextRelease.version !== context.lastRelease.version).toString())
}

module.exports = {
  verifyRelease,
}
