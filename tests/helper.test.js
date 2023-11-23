const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const helper = require ('./list_helper')
const Blog = require('../models/blog')
const User = require('../models/user')
const jwt = require('jsonwebtoken')


beforeEach(async () => {
  await Blog.deleteMany({})
  await Blog.insertMany(helper.initialBlogs)
  await User.deleteMany({})
  await User.insertMany(helper.initialUsers)
})


test('dummy returns one', () => {

  const blogs = []
  const result = helper.dummy(blogs)
  expect(result).toBe(1)

})


describe ('fav blog', () => {


  test('new fav blog is the one with most likes', () => {

    const expected = {
      _id: '5a422b3a1b54a676234d17f9',
      title: 'Canonical string reduction',
      author: 'Edsger W. Dijkstra',
      url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
      likes: 12,
      __v: 0
    }
    const result = helper.newFavoriteBlog()
    expect(result).toEqual(expected)

  })


})


describe('total likes', () => {


  test('when list has only one blog, equals the likes of that', () => {

    const result = helper.totalLikes()
    expect(result).toBe(7)



  })



})


test('blogs are returned as json', async () => {

  await api
    .get('/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('unique identifier property is named id ', async() => {

  const response = await api.get('/blogs').expect(200)
  const blogsList = response.body

  blogsList.forEach(blog => {

    expect(blog.id).toBeDefined()

  })


})


test('a new blog can be added ', async () => {
  const newBlog = {
    title: 'React patterns part II',
    author: 'Michael Chan',
    url: 'https://reactpatterns.com/',
    likes: 7,
  }

  const users = await helper.usersInDb()
  const user = users[0]

  const token = jwt.sign({ id: user._id }, process.env.SECRET)

  await api
    .post('/blogs')
    .send(newBlog)
    .set('Authorization', `Bearer ${token}`)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const blogsAtEnd = await helper.blogsInDb()
  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

  const titles = blogsAtEnd.map((t) => t.title)
  expect(titles).toContain('React patterns part II')
})


test('if likes property is missing, it defaults to 0', async () => {

  const newBlog = {
    title: 'React Patterns part II',
    author: 'Robert C.Martin',
    url: 'www.reactpatternspartII.com',
  }

  await api
    .post('/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const blogsAtEnd = await helper.blogsInDb()
  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)
  const likes = blogsAtEnd.map (l => l.likes)
  expect(likes).toBeDefined()
  likes.forEach( (like) =>
    expect(like).toBeGreaterThanOrEqual(0))


})

test('bad request status 400 if title or url are missing ', async () => {

  const newBlog = {
    author: 'Unknown',
    likes: 20
  }

  const response = await api.post('/blogs').send(newBlog).expect(400)
  expect(response.status).toBe(400)
  const blogsAtEnd = await helper.blogsInDb()
  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)

})

describe('deletion of a single blog ', () => {

  test('succeeds with status code 204 if id is valid ', async () => {

    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    await api
      .delete(`/blogs/${blogToDelete.id}`)
      .expect(204)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length -1 )

    const titles = blogsAtEnd.map (r => r.title)
    expect(titles).not.toContain(blogToDelete.title)

  })




})

test('update likes ', async () => {

  const blogsAtStart = await helper.blogsInDb()
  const blogToUpdate = blogsAtStart[3]

  const updatedBlog = {
    title: blogToUpdate.title,
    author: blogToUpdate.author,
    url: blogToUpdate.url,
    likes: 20
  }

  const result = await api
    .put(`/blogs/${blogToUpdate.id}`)
    .send(updatedBlog)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  expect(result.body.likes).toBe(20)


})

test ('search for a single blog by id ', async () => {

  const blogsAtStart = await helper.blogsInDb()
  const blogToView = blogsAtStart[3]

  const resultBlog = await api
    .get(`/blogs/${blogToView.id}`)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  expect(resultBlog.body).toEqual(blogToView)

})

test ('author with most blogs', async () => {

  const result = helper.mostBlogs(helper.initialBlogs)

  expect(result).toEqual({
    author: 'Robert C. Martin',
    blogs: 3,
  })



})

test ('author with most likes ', async () => {

  const result = helper.mostLikes(helper.initialBlogs)


  expect(result).toEqual({
    author: 'Edsger W. Dijkstra',
    likes: 17,
  })


})


afterAll(async () => {
  await mongoose.connection.close()
})



