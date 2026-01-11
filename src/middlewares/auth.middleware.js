const jwt = require('jsonwebtoken')
const prisma = require('../config/prisma')

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || ''
    const [type, token] = authHeader.split(' ')

    if (type !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    if (!process.env.JWT_ACCESS_SECRET) {
      return res.status(500).json({ message: 'JWT_ACCESS_SECRET_MISSING' })
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET)

    if (!decoded?.sub) {
      return res.status(401).json({ message: 'Invalid token' })
    }

    const user = await prisma.user.findUnique({
      where: { id: BigInt(decoded.sub) },
      select: { tokenVersion: true, status: true },
    })

    if (!user) return res.status(401).json({ message: 'Unauthorized' })
    if (user.status !== 'active') return res.status(403).json({ message: 'Forbidden' })

    if (user.tokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({ message: 'TOKEN_REVOKED' })
    }

    req.user = decoded
    return next()
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' })
  }
}
