const prisma = require('../../config/prisma')
const bcrypt = require('bcryptjs')

exports.getUsers = () => {
   return prisma.user.findMany({
    select: {
      id: true,
      username: true,
      phone: true,
      status: true,
      lastLogin: true,
      createdAt: true,
    },
    orderBy: { id: 'desc' },
  })
}

exports.createUser = async (data) => {
  const { username, phone, password } = data

  if (!username || !phone || !password) {
    const e = new Error('INVALID_PAYLOAD')
    e.status = 400
    throw e
  }

  const exist = await prisma.user.findFirst({
    where: { OR: [{ username }, { phone }] },
    select: { id: true },
  })

  if (exist) {
    const e = new Error('USER_ALREADY_EXISTS')
    e.status = 409
    throw e
  }

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

exports.updateUser = async (id, data) => {

  if (!/^\d+$/.test(String(id))) throw new Error('INVALID_ID')

    
  if (!id) {
    const e = new Error('INVALID_ID')
    e.status = 400
    throw e
  }

  const { username, phone, password, status } = data

  // ✅ กัน update ว่าง ๆ
  if (
    username === undefined &&
    phone === undefined &&
    password === undefined &&
    status === undefined
  ) {
    const e = new Error('NOTHING_TO_UPDATE')
    e.status = 400
    throw e
  }

  // ✅ เช็คว่ามี user ไหมก่อน
  const existing = await prisma.user.findUnique({
    where: { id: BigInt(id) },
    select: { id: true },
  })
  if (!existing) {
    const e = new Error('USER_NOT_FOUND')
    e.status = 404
    throw e
  }

  // ✅ กัน username/phone ซ้ำ (ถ้ามีส่งมา)
  if (username !== undefined || phone !== undefined) {
    const dup = await prisma.user.findFirst({
      where: {
        AND: [
          { id: { not: BigInt(id) } },
          {
            OR: [
              username !== undefined ? { username } : undefined,
              phone !== undefined ? { phone } : undefined,
            ].filter(Boolean),
          },
        ],
      },
      select: { id: true },
    })

    if (dup) {
      const e = new Error('USER_ALREADY_EXISTS')
      e.status = 409
      throw e
    }
  }

  const updateData = {}

  if (username !== undefined) updateData.username = username
  if (phone !== undefined) updateData.phone = phone
  if (status !== undefined) updateData.status = status

  if (password !== undefined) {
    updateData.password = await bcrypt.hash(password, 10)
  }

  return prisma.user.update({
    where: { id: BigInt(id) },
    data: updateData,
    select: {
      id: true,
      username: true,
      phone: true,
      status: true,
      lastLogin: true,
      createdAt: true,
    },
  })
}