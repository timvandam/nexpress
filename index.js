const nexpress = require('./lib/nexpress')

const app = nexpress()

app.use((data, res) => {
  res.send(Buffer.from('hi'))
})

app.listen(2650)

module.exports = nexpress
