
import mongoose, { Schema, Document, Model } from 'mongoose';
import type { User as UserType } from '@/types';
import bcrypt from 'bcryptjs';

export interface IUserDocument extends Omit<UserType, 'id'>, Document {
  password?: string;
  pin?: string;
  comparePassword(candidate: string, type: 'password' | 'pin'): Promise<boolean>;
}

const UserSchema = new Schema<IUserDocument>({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true, select: false },
  name: { type: String, required: true, trim: true },
  profileImageUrl: { type: String, trim: true, default: '' },
  backgroundImageUrl: { type: String, trim: true, default: '' },
  pin: { type: String, select: false },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (_doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      delete ret.pin;
    },
  },
  toObject: {
    virtuals: true,
    transform: function (_doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      delete ret.pin;
    },
  },
});

UserSchema.methods.comparePassword = async function (candidate: string, type: 'password' | 'pin'): Promise<boolean> {
  const hash = this[type];
  if (!hash) return false;
  return bcrypt.compare(candidate, hash);
};

const hashField = async function (this: IUserDocument, field: 'password' | 'pin') {
    if (this.isModified(field) && this[field]) {
        try {
            const salt = await bcrypt.genSalt(10);
            this[field] = await bcrypt.hash(this[field] as string, salt);
        } catch (error: any) {
            throw error;
        }
    }
};

UserSchema.pre<IUserDocument>('save', async function (next) {
    try {
        await Promise.all([
            hashField.call(this, 'password'),
            hashField.call(this, 'pin')
        ]);
        next();
    } catch (error: any) {
        next(error);
    }
});


UserSchema.pre('findOne', function(next) {
  this.select('+password +pin');
  next();
});

const UserModel = mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);

export default UserModel as Model<IUserDocument>;
