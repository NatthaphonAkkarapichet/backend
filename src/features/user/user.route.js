const express = require('express')
const router = express.Router()
const controller = require('./user.controller')
const auth = require('../../middlewares/auth.middleware')

router.get('/', auth, controller.getUsers)
router.post('/', auth, controller.createUser)
router.put('/:id', auth, controller.updateUser)

module.exports = router
