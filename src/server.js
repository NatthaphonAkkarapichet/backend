require('dotenv').config()


BigInt.prototype.toJSON = function () {
  return this.toString()
}

const app = require('./app')

const PORT = process.env.PORT || 3000


app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})
