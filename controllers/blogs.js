const jwt = require('jsonwebtoken')
const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const middleware = require('../utils/middleware')


blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
  response.json(blogs)
})

blogsRouter.put('/:id', async (request, response) => {
  const id = request.params.id
  const { title, author, url, likes } = request.body


  if (!title || !author || !url || likes === undefined) {
    return response.status(400).json({ error: 'Missing required properties' })
  }

  const updatedBlog = await Blog.findByIdAndUpdate(
    id,
    { title, author, url, likes },
    { new: true }
  )

  if (!updatedBlog) {
    return response.status(404).json({ error: 'Blog not found' })
  }

  response.json(updatedBlog)
})



blogsRouter.post('/', middleware.userExtractor, async (request, response) => {

  const user = request.user
  const body = request.body

  const decodedToken = jwt.verify(request.token, process.env.SECRET)

  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' })
  }


  if (body.title === undefined || body.url === undefined) {
    return response.status(400).end()
  }

  const blog = new Blog ({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes === undefined ? 0 : body.likes,
    user: user._id

  })

  const savedBlog = await blog.save()
  user.blogs = user.blogs.concat(savedBlog._id)
  await user.save()
  response.status(201).json(savedBlog)


})


blogsRouter.get('/:id', async (request,response) => {



  const blog = await Blog.findById(request.params.id)
  if(blog)
  {
    response.json(blog)
  }
  else{
    response.status(404).end()
  }



})

blogsRouter.delete('/:id', middleware.userExtractor, async (request, response) => {
  try {

    const blog = await Blog.findById(request.params.id)
    if (!blog) {
      return response.status(404).json({ error: 'Blog not found' })
    }

    const decodedToken = jwt.verify(request.token, process.env.SECRET)

    const user = request.user
    if (!user) {
      return response.status(404).json({ error: 'User not found' })
    }

    if (blog.user.toString() === decodedToken.id) {
      await Blog.deleteOne({ _id: blog._id })
      response.status(204).end()
    } else {
      return response.status(403).json({ error: 'Unauthorized: Invalid user or token.' })
    }
  } catch (error) {
    return response.status(500).json({ error: 'Internal Server Error' })
  }
})




module.exports = blogsRouter

