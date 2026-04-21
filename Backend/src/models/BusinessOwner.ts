import mongoose, { Schema, Document, Model } from 'mongoose'
import bcryptjs from 'bcryptjs'

export interface IBusinessOwner extends Document {
  name: string
  email: string
  passwordHash: string
  businessName: string
  businessId: mongoose.Types.ObjectId
  plan: 'free' | 'pro'
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  comparePassword(plain: string): Promise<boolean>
}

const businessOwnerSchema = new Schema<IBusinessOwner>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    businessId: {
      type: Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
    plan: {
      type: String,
      enum: ['free', 'pro'],
      default: 'free',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

businessOwnerSchema.virtual('id').get(function (this: IBusinessOwner) {
  return (this._id as mongoose.Types.ObjectId).toHexString()
})

businessOwnerSchema.pre<IBusinessOwner>('save', async function () {
  if (!this.isModified('passwordHash')) return
  this.passwordHash = await bcryptjs.hash(this.passwordHash, 12)
})

businessOwnerSchema.methods.comparePassword = function (
  this: IBusinessOwner,
  plain: string
): Promise<boolean> {
  return bcryptjs.compare(plain, this.passwordHash)
}

const BusinessOwner: Model<IBusinessOwner> = mongoose.model<IBusinessOwner>(
  'BusinessOwner',
  businessOwnerSchema
)

export default BusinessOwner
