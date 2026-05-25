import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findAll(): Promise<User[]> {
    return this.userModel.find({}, { passwordHash: 0 }).exec();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async create(email: string, passwordHash: string, name: string): Promise<User> {
    const newUser = new this.userModel({ email, passwordHash, name });
    return newUser.save();
  }

  async updateName(id: string, name: string): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(id, { name }, { new: true }).select('-passwordHash').exec();
  }
}
