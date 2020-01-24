# nexpress
Express like framework for TCP servers

## Example

```js
# Creating a simple nexpress tcp server
const nexpress = require('nexpress')
const app = nexpress()

# Middleware to identify incoming data
app.use((data, res, next) => {
  data.id = computeDataId(data.buffer)
  next()
})

# Middleware to handle some data with id 'greeting'
app.use('greeting', (data, res) => {
  res.send(Buffer.from('Nexpress has received your greeting!'))
})

# Middleware that throws an error
app.use((data, res, next) => {
  next(new Error('Something went wrong!'))
})

# Error handler middleware
app.use((error, data, res, next) => {
  // Handle your error here
})

app.listen(3000, () => console.log('Nexpress is now listening on port 3000'))
```
