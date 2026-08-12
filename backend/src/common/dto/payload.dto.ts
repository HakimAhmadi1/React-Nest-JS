import { ApiProperty } from '@nestjs/swagger';

/** The authenticated principal, built from JWT claims by `JwtAuthGuard`. */
export class PayloadDto {
  @ApiProperty({ type: Number, example: 1 })
  userId!: number;

  @ApiProperty({ type: String, example: 'USR000001' })
  userCode!: string;

  @ApiProperty({ type: String, example: 'user@example.com' })
  email!: string;

  @ApiProperty({ type: String, example: 'John Doe' })
  name!: string;

  @ApiProperty({ type: String, example: 'ADMIN' })
  role!: string;

  @ApiProperty({ type: Boolean, example: true })
  isActive!: boolean;

  @ApiProperty({ type: [String], example: ['ADMIN'] })
  roles!: string[];

  @ApiProperty({ type: [String], example: ['user.view'] })
  permissions!: string[];
}
