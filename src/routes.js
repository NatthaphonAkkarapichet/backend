const express = require('express')
const router = express.Router()

const userRoutes = require('./features/user/user.route')
const authRoutes = require('./features/auth/auth.route')


router.use('/users', userRoutes)
router.use('/auth', authRoutes)

module.exports = router
