const service = require('./user.service')

exports.getUsers = async (req, res) => {
  const users = await service.getUsers()
  res.json(users)
}

exports.createUser = async (req, res) => {
  const user = await service.createUser(req.body)
  res.status(201).json(user)
}

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params
    const user = await service.updateUser(id, req.body)
    return res.json(user)
  } catch (e) {
    console.error('UPDATE_USER_ERROR:', e)

    if (e.message === 'INVALID_ID') return res.status(400).json({ message: 'INVALID_ID' })
    if (e.message === 'NOTHING_TO_UPDATE') return res.status(400).json({ message: 'NOTHING_TO_UPDATE' })
    if (e.message === 'USER_NOT_FOUND') return res.status(404).json({ message: 'USER_NOT_FOUND' })
    if (e.message === 'USER_ALREADY_EXISTS') return res.status(409).json({ message: 'USER_ALREADY_EXISTS' })

    return res.status(500).json({ message: 'SERVER_ERROR', detail: e.message })
  }
}