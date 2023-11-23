
const app = require('./app')
const config = require('./utils/congif')
const logger = require('./utils/logger')


app.listen(config.PORT, () => {
  logger.info(`Server running on port ${config.PORT}`)
})

//remember to do exercises 4.6 and 4.7 at the end of part 4!