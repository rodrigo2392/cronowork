import { Controller, Get, Put, Body, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(@Req() req: any) {
    // Only users that share a project with the requester (not the whole directory).
    return this.usersService.findRelatedUsers(req.user.userId, req.user.email);
  }

  @Put('profile')
  async updateProfile(@Req() req: any, @Body() body: any) {
    return this.usersService.updateName(req.user.userId, body.name);
  }
}
