
import mongoose, { Schema, Document, Model } from 'mongoose';
import type { User as UserType } from '@/types';

export interface IUserDocument extends Omit<UserType, 'id'>, Document {
  password?: string; // Password for authentication users
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// UserSchema will be used for authenticated users
const UserSchemaFields = {
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true }, // Password is required for login users
  name: { type: String, required: true, trim: true },
  profileImageUrl: { type: String, trim: true, default: '' },
  backgroundImageUrl: { type: String, trim: true, default: '' },
};

const UserSchema = new Schema<IUserDocument>(UserSchemaFields, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (_doc, ret) {
      ret.id = ret._id.toString(); // Ensure id is a string
      delete ret._id;
      delete ret.__v;
      delete ret.password; // Ensure password hash is not sent
    },
  },
  toObject: {
    virtuals: true,
    transform: function (_doc, ret) {
      ret.id = ret._id.toString(); // Ensure id is a string
      delete ret._id;
      delete ret.__v;
      delete ret.password;
    },
  },
});

// Method to compare password for login
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false; 
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(candidatePassword, this.password);
};

// Pre-save hook to hash password if it's modified (e.g., on registration or password change)
UserSchema.pre<IUserDocument>('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  try {
    const bcrypt = await import('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

const UserModel = mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);

export default UserModel as Model<IUserDocument>;
