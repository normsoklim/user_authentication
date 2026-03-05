import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  access_token: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...refresh...'
  })
  refresh_token: string;

  @ApiProperty({
    example: {
      id: '1',
      username: 'John',
      email: 'john@example.com',
      role: 'user'
    }
  })
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}