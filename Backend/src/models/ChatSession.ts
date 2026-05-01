import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IMessage {
  role: 'user' | 'assistant'
  content: string
  detectedLanguage: string
  timestamp: Date
}

export interface IChatSession extends Document {
  sessionId: string
  businessId: mongoose.Types.ObjectId
  messages: IMessage[]
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

const messageSchema = new Schema<IMessage>(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    detectedLanguage: {
      type: String,
      default: 'english',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
)

const chatSessionSchema = new Schema<IChatSession>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    businessId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    messages: [messageSchema],
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true }
)

chatSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

const ChatSession: Model<IChatSession> = mongoose.model<IChatSession>(
  'ChatSession',
  chatSessionSchema
)

export default ChatSession
