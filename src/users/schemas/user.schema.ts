import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  _id?: Types.ObjectId;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  password?: string;

  @Prop({
    type: String,
    enum: ['admin', 'staff', 'user'],
    default: 'user',
  })
  role: string;

  @Prop({ required: true, enum: ['local', 'google', 'facebook'], default: 'local' })
  provider: 'local' | 'google' | 'facebook';

  @Prop()
  providerId?: string;

  @Prop()
  name?: string;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop()
  emailVerificationToken?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);