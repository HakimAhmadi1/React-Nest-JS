import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@database/entities/user.entity';
import { UpdateProfileDto } from '@common/dto/users.dto';

/** Fields the owner of an account may change about themselves. */
const SELF_EDITABLE = [
  'name',
  'avatar',
  'address',
  'city',
  'zipCode',
  'country',
] as const;

@Injectable()
export class ProfileService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  async findById(id: number): Promise<User> {
    const user = await this.users.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateProfile(id: number, dto: UpdateProfileDto): Promise<User> {
    const user = await this.findById(id);

    for (const field of SELF_EDITABLE) {
      if (dto[field] !== undefined) {
        user[field] = dto[field];
      }
    }

    return this.users.save(user);
  }
}
