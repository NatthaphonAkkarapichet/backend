const authService = require('./auth.service')

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: false, // ✅ ถ้าเป็น https ให้เปลี่ยนเป็น true
  path: '/api/auth/refresh', // ✅ cookie ส่งเฉพาะตอน refresh
}

exports.register = async (req, res) => {
  try {
    const user = await authService.register(req.body)
    return res.status(201).json(user)
  } catch (e) {
    console.error(e)

    if (e.message === 'USER_ALREADY_EXISTS') {
      return res.status(409).json({ message: 'USER_ALREADY_EXISTS' })
    }
    if (e.message === 'INVALID_PAYLOAD') {
      return res.status(400).json({ message: 'INVALID_PAYLOAD' })
    }

    return res.status(500).json({ message: 'SERVER_ERROR', detail: e.message })
  }
}

exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body
    const { accessToken, refreshToken, user } = await authService.login(identifier, password)

    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30d (ให้ตรงกับ REFRESH_EXPIRES_IN)
    })

    return res.json({ accessToken, user })
  } catch (e) {
    if (e.message === 'Invalid credentials') {
      return res.status(401).json({ message: 'INVALID_CREDENTIALS' })
    }
    return res.status(500).json({ message: 'SERVER_ERROR', detail: e.message })
  }
}

exports.logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken
    await authService.logout(refreshToken)

    res.clearCookie('refreshToken')
    return res.json({ message: 'LOGOUT_SUCCESS' })
  } catch (e) {
    return res.status(500).json({ message: 'SERVER_ERROR', detail: e.message })
  }
}

exports.refresh = async (req, res) => {
  try {
    const token = req.cookies.refreshToken
    if (!token) return res.status(401).json({ message: 'NO_REFRESH_TOKEN' })

    const { accessToken, refreshToken } = await authService.refresh(token)

    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    })

    return res.json({ accessToken })
  } catch (e) {
    const msg =
      e.message === 'TOKEN_REVOKED' ? 'TOKEN_REVOKED' :
      e.message === 'INVALID_REFRESH_TOKEN' ? 'INVALID_REFRESH_TOKEN' :
      'SERVER_ERROR'
    return res.status(401).json({ message: msg, detail: e.message })
  }
}

exports.logoutAll = async (req, res) => {
  await authService.logoutAll(req.user.sub)
  return res.json({ message: 'LOGOUT_ALL_SUCCESS' })
}

