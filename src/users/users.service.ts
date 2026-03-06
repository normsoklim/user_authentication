import { Injectable } from '@nestjs/common';
import { User, UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { HashUtil } from '../utils/hash.util';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>
    ) { }
    async create(createUserDto: Partial<User>): Promise<User> {
        // Set default provider to 'local' if not provided
        if (!createUserDto.provider) {
            createUserDto.provider = 'local';
        }
        
        const createdUser = new this.userModel(createUserDto);
        const savedUser = await createdUser.save();
        return savedUser.toObject() as User;
    }

    async findAll(): Promise<User[]> {
        const users = await this.userModel.find().exec();
        return users.map(user => user.toObject() as User);
    }

    async findByEmail(email: string): Promise<User | null> {
        const user = await this.userModel.findOne({ email });
        return user ? user.toObject() as User : null;
    }
    
    async findById(id: string): Promise<User | null> {
      const user = await this.userModel.findById(id);
      return user ? user.toObject() as User : null;
    }
    
    async findOne(filter: any): Promise<User | null> {
      const user = await this.userModel.findOne(filter);
      return user ? user.toObject() as User : null;
    }
    
    async update(id: string, updateData: Partial<User>): Promise<User | null> {
      const updatedUser = await this.userModel.findByIdAndUpdate(id, updateData, { new: true });
      return updatedUser ? updatedUser.toObject() as User : null;
    }
    
    async findByEmailVerificationToken(token: string): Promise<User | null> {
      const user = await this.userModel.findOne({ emailVerificationToken: token });
      return user ? user.toObject() as User : null;
    }
  }
