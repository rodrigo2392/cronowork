import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(pass, user.passwordHash)) {
      const { passwordHash, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user._id };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user._id, email: user.email, name: user.name }
    };
  }

  async register(email: string, pass: string, name: string) {
    // Canonicalize the email so accounts are stored consistently and the
    // sharing ACL (members/roles, keyed by email) always lines up later.
    const normalizedEmail = (email || '').trim().toLowerCase();
    const existingUser = await this.usersService.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(pass, saltRounds);

    const newUser = await this.usersService.create(normalizedEmail, passwordHash, name);
    return this.login(newUser);
  }
}
