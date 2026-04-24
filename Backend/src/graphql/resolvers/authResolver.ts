import jwt from 'jsonwebtoken'
import BusinessOwner from '../../models/BusinessOwner.js'
import { env } from '../../config/env.js'
import { registerSchema, loginSchema } from '../../utils/validators.js'
import logger from '../../utils/logger.js'

interface AuthContext {
  user: { ownerId: string; businessId: string; email: string } | null
}

function signToken(payload: { ownerId: string; businessId: string; email: string }): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions)
}

export const authResolvers = {
  Query: {
    me: async (_: unknown, __: unknown, context: AuthContext) => {
      if (!context.user) {
        throw new Error('Not authenticated')
      }
      const owner = await BusinessOwner.findById(context.user.ownerId)
      if (!owner) throw new Error('User not found')
      return {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        businessName: owner.businessName,
        businessId: owner.businessId.toString(),
        plan: owner.plan,
      }
    },
  },

  Mutation: {
    register: async (
      _: unknown,
      args: { name: string; email: string; password: string; businessName: string }
    ) => {
      const data = registerSchema.parse(args)

      const existing = await BusinessOwner.findOne({ email: data.email })
      if (existing) throw new Error('Email already registered')

      const owner = new BusinessOwner({
        name: data.name,
        email: data.email,
        passwordHash: data.password,
        businessName: data.businessName,
      })

      await owner.save()

      logger.info('New business owner registered', { email: owner.email, businessId: owner.businessId })

      const token = signToken({
        ownerId: (owner._id as { toString(): string }).toString(),
        businessId: owner.businessId.toString(),
        email: owner.email,
      })

      return {
        token,
        owner: {
          id: owner.id,
          name: owner.name,
          email: owner.email,
          businessName: owner.businessName,
          businessId: owner.businessId.toString(),
          plan: owner.plan,
        },
      }
    },

    login: async (_: unknown, args: { email: string; password: string }) => {
      const data = loginSchema.parse(args)

      const owner = await BusinessOwner.findOne({ email: data.email, isActive: true })
      if (!owner) throw new Error('Invalid credentials')

      const valid = await owner.comparePassword(data.password)
      if (!valid) throw new Error('Invalid credentials')

      logger.info('Business owner logged in', { email: owner.email })

      const token = signToken({
        ownerId: (owner._id as { toString(): string }).toString(),
        businessId: owner.businessId.toString(),
        email: owner.email,
      })

      return {
        token,
        owner: {
          id: owner.id,
          name: owner.name,
          email: owner.email,
          businessName: owner.businessName,
          businessId: owner.businessId.toString(),
          plan: owner.plan,
        },
      }
    },
  },
}
