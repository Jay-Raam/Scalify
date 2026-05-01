export const typeDefs = /* GraphQL */ `
  type BusinessOwner {
    id: ID!
    name: String!
    email: String!
    businessName: String!
    businessId: ID!
    plan: String!
  }

  type AuthPayload {
    token: String!
    owner: BusinessOwner!
  }

  type Message {
    role: String!
    content: String!
    timestamp: String!
    detectedLanguage: String
  }

  type ChatResponse {
    message: String!
    detectedLanguage: String!
    sessionId: String!
  }

  enum AttachmentType {
    FILE
    IMAGE
  }

  input AttachmentInput {
    name: String!
    type: AttachmentType!
    mimeType: String!
    size: Int!
    content: String!
  }

  type HealthStatus {
    status: String!
    uptime: Float!
    memoryMB: Float!
    mongoConnected: Boolean!
    redisConnected: Boolean!
  }

  type Query {
    getChatHistory(sessionId: ID!): [Message!]!
    health: HealthStatus!
    me: BusinessOwner
  }

  type Mutation {
    register(name: String!, email: String!, password: String!, businessName: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    sendMessage(
      businessId: ID!
      sessionId: ID
      message: String!
      attachments: [AttachmentInput!]
    ): ChatResponse!
    createSession(businessId: ID!): String!
  }
`
