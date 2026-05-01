import { authResolvers } from './authResolver.js'
import { chatResolvers } from './chatResolver.js'

const resolvers = {
  Query: {
    ...authResolvers.Query,
    ...chatResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...chatResolvers.Mutation,
  },
}

export default resolvers
