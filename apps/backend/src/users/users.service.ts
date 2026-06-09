import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from './schemas/user.schema';
import { Project } from '../projects/schemas/project.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Project.name) private projectModel: Model<Project>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userModel.find({}, { passwordHash: 0 }).exec();
  }

  // Returns only users that share at least one project with the requester
  // (project owners, sharedWith and members), plus the requester. Avoids
  // exposing the entire user directory to any authenticated user.
  async findRelatedUsers(userId: string, email: string): Promise<User[]> {
    const or: any[] = [];
    if (userId) or.push({ userId }, { sharedWith: userId });
    if (email) or.push({ members: email });
    if (or.length === 0) return [];

    const projects = await this.projectModel
      .find({ $or: or }, { userId: 1, sharedWith: 1, members: 1 })
      .exec();

    const ids = new Set<string>();
    const emails = new Set<string>();
    if (userId) ids.add(userId);
    if (email) emails.add(email);
    for (const p of projects) {
      if (p.userId) ids.add(p.userId);
      (p.sharedWith || []).forEach((id) => id && ids.add(id));
      (p.members || []).forEach((em) => em && emails.add(em));
    }

    const validIds = [...ids].filter((id) => Types.ObjectId.isValid(id));
    return this.userModel
      .find(
        { $or: [{ _id: { $in: validIds } }, { email: { $in: [...emails] } }] },
        { passwordHash: 0 },
      )
      .exec();
  }

  // Case-insensitive exact match: emails are identity, so "User@x.com" and
  // "user@x.com" must resolve to the same account (login, invites, dedup).
  async findByEmail(email: string): Promise<User | null> {
    if (typeof email !== 'string' || !email.trim()) return null;
    const escaped = email.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.userModel
      .findOne({ email: { $regex: new RegExp(`^${escaped}$`, 'i') } })
      .exec();
  }

  async findByEmailOrName(identifier: string): Promise<User | null> {
    if (typeof identifier !== 'string' || !identifier.trim()) return null;
    // Escape regex metacharacters to prevent regex injection / ReDoS.
    const escaped = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Busca primero por email, si no, busca por nombre exacto (case-insensitive)
    return this.userModel.findOne({
      $or: [
        { email: identifier },
        { name: { $regex: new RegExp(`^${escaped}$`, 'i') } }
      ]
    }).exec();
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
