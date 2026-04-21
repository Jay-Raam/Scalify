import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IFAQ extends Document {
  businessId: mongoose.Types.ObjectId
  question: string
  answer: string
  language: 'tamil' | 'english' | 'both'
  category: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const faqSchema = new Schema<IFAQ>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
    },
    language: {
      type: String,
      enum: ['tamil', 'english', 'both'],
      required: true,
    },
    category: {
      type: String,
      default: 'general',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

faqSchema.index({ businessId: 1, language: 1 })
faqSchema.index({ question: 'text', answer: 'text' })

const FAQ: Model<IFAQ> = mongoose.model<IFAQ>('FAQ', faqSchema)

export default FAQ
