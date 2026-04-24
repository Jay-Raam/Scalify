import { createYoga } from 'graphql-yoga'
import { makeExecutableSchema } from '@graphql-tools/schema'
import jwt from 'jsonwebtoken'
import { typeDefs } from './schema/typeDefs.js'
import resolvers from './resolvers/index.js'
import { env } from '../config/env.js'
import logger from '../utils/logger.js'

const schema = makeExecutableSchema({ typeDefs, resolvers })

export const yoga = createYoga({
  schema,
  context: async ({ request }) => {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.split(' ')[1]

    if (!token) return { user: null }

    try {
      const user = jwt.verify(token, env.JWT_SECRET)
      return { user }
    } catch (err) {
      logger.warn('JWT verification failed', {
        error: err instanceof Error ? err.message : String(err),
      })
      return { user: null }
    }
  },
  graphiql: env.NODE_ENV === 'development',
  maskedErrors: env.NODE_ENV === 'production',
  landingPage: false,
})
