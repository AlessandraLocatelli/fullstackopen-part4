
const mongoose = require('mongoose')

if (process.argv.length < 3) {
  console.log('Usage: node mongo.js <password> [<title> <author> <url> <likes>]')
  process.exit(1)
}

const password = process.argv[2]

const url = `mongodb+srv://fullstackk:${password}@cluster0.iqm7nut.mongodb.net/?retryWrites=true&w=majority`

mongoose.set('strictQuery', false)

mongoose.connect(url)

const blogSchema = new mongoose.Schema({

  title: String,
  author: String,
  url: String,
  likes:  Number


})


const Blog = mongoose.model('Blog', blogSchema)

if (process.argv.length === 3) {
  Blog.find({}).then(result => {
    result.forEach(blog => {
      console.log(blog)
    })
    mongoose.connection.close()
  })
} else if (process.argv.length === 7) {

  const title = process.argv[3]
  const author = process.argv[4]
  const url = process.argv[5]
  const likes = process.argv[6]

  const blog = new Blog({
    title: title,
    author: author,
    url: url,
    likes: likes
  })

  blog.save().then(() => {
    Blog.find({}).then( updatedBlogs => {
      console.log('Updated list of blogs:')
      updatedBlogs.forEach(updatedBlog => {
        console.log(updatedBlog)
      })
      mongoose.connection.close()
    })
  })
} else {
  console.log('Invalid input. Please provide a password, or a password, author, title, url and likes.')
  mongoose.connection.close()
}

//remember to do exercises 4.6 and 4.7 at the end of part 4!


