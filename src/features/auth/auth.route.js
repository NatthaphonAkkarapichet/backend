const express = require('express')
const router = express.Router()
const controller = require('./auth.controller')
const authMiddleware = require('../../middlewares/auth.middleware') 

console.log('AUTH CONTROLLER:', controller)

router.post('/register', controller.register)
router.post('/login', controller.login)
router.post('/logout', controller.logout)

router.get('/test', (req, res) => {
  res.send('auth ok')
})

module.exports = router