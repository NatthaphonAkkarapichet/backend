const prisma = require('../../config/prisma')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto') // ✅ FIX: ต้องมี

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m'
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d'

// ✅ validate env
if (!ACCESS_SECRET) throw new Error('JWT_ACCESS_SECRET is missing in .env')
if (!REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET is missing in .env')

// ------------------ utils ------------------
const sha256Hex = (s) =>
  crypto.createHash('sha256').update(s).digest('hex')

function expiresAtFromNow(ms) {
  return new Date(Date.now() + ms)
}

function parseDurationToMs(str) {
  const m = /^(\d+)([mhd])$/.exec(str)
  if (!m) return 30 * 24 * 60 * 60 * 1000
  const n = Number(m[1])
  if (m[2] === 'm') return n * 60 * 1000
  if (m[2] === 'h') return n * 60 * 60 * 1000
  return n * 24 * 60 * 60 * 1000
}

// ------------------ token sign ------------------
function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id.toString(),
      tokenVersion: user.tokenVersion,
      username: user.username,
      phone: user.phone,
      status: user.status,
    },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  )
}

function signRefreshToken(user) {
  return jwt.sign(
    {
      sub: user.id.toString(),
      tokenVersion: user.tokenVersion,
      type: 'refresh',
    },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  )
}

// ------------------ register ------------------
exports.register = async (body) => {
  const { username, phone, password } = body
  if (!username || !phone || !password) {
    throw new Error('INVALID_PAYLOAD')
  }

  const exist = await prisma.user.findFirst({
    where: { OR: [{ username }, { phone }] },
    select: { id: true },
  })
  if (exist) throw new Error('USER_ALREADY_EXISTS')

  const hashed = await bcrypt.hash(password, 10)

  return prisma.user.create({
    data: {
      username,
      phone,
      password: hashed,
      status: 'active',
    },
    select: {
      id: true,
      username: true,
      phone: true,
      status: true,
      createdAt: true,
    },
  })
}

// ------------------ login ------------------
exports.login = async (identifier, password) => {
  const user = await prisma.user.findFirst({
    where: { OR: [{ username: identifier }, { phone: identifier }] },
  })
  if (!user) throw new Error('Invalid credentials')

  const ok = await bcrypt.compare(password, user.password)
  if (!ok) throw new Error('Invalid credentials')

  // ✅ update lastLogin
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  })

  const accessToken = signAccessToken(user)
  const refreshToken = signRefreshToken(user)

  const tokenHash = sha256Hex(refreshToken)
  const refreshMs = parseDurationToMs(REFRESH_EXPIRES_IN)

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: expiresAtFromNow(refreshMs),
    },
  })

  return {
    accessToken,
    refreshToken, // controller จะเอาไป set cookie
    user: {
      id: user.id.toString(),
      username: user.username,
      phone: user.phone,
      status: user.status,
    },
  }
}

// ------------------ refresh ------------------
exports.refresh = async (rawRefreshToken) => {
  let payload
  try {
    payload = jwt.verify(rawRefreshToken, REFRESH_SECRET)
  } catch {
    throw new Error('INVALID_REFRESH_TOKEN')
  }

  if (payload?.type !== 'refresh') {
    throw new Error('INVALID_REFRESH_TOKEN')
  }

  const user = await prisma.user.findUnique({
    where: { id: BigInt(payload.sub) },
    select: { id: true, tokenVersion: true, username: true, phone: true, status: true },
  })
  if (!user) throw new Error('INVALID_REFRESH_TOKEN')
  if (user.status !== 'active') throw new Error('FORBIDDEN')
  if (user.tokenVersion !== payload.tokenVersion) {
    throw new Error('TOKEN_REVOKED')
  }

  const tokenHash = sha256Hex(rawRefreshToken)
  const rec = await prisma.refreshToken.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  })
  if (!rec) throw new Error('INVALID_REFRESH_TOKEN')

  const newAccessToken = signAccessToken(user)
  const newRefreshToken = signRefreshToken(user)
  const refreshMs = parseDurationToMs(REFRESH_EXPIRES_IN)

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: rec.id },
      data: { revokedAt: new Date() },
    }),
    prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256Hex(newRefreshToken),
        expiresAt: expiresAtFromNow(refreshMs),
      },
    }),
  ])

  return { accessToken: newAccessToken, refreshToken: newRefreshToken }
}

// ------------------ logout ------------------
exports.logout = async (rawRefreshToken) => {
  if (!rawRefreshToken) return

  await prisma.refreshToken.updateMany({
    where: {
      tokenHash: sha256Hex(rawRefreshToken),
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  })
}

exports.logoutAll = async (userId) => {
  await prisma.$transaction([
    prisma.refreshToken.updateMany({
      where: { userId: BigInt(userId), revokedAt: null },
      data: { revokedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: BigInt(userId) },
      data: { tokenVersion: { increment: 1 } },
    }),
  ])
}
