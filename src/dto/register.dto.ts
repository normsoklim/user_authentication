import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({
        example: 'John'
    })
    username: string;

    @ApiProperty({
        example: 'john@example.com'
    })
    email: string;

    @ApiProperty({
        example: 'password123'
    })
    password: string;

    @ApiProperty({
        example: 'user',
        required: false
    })
    role?: string;

    @ApiProperty({
        example: '123456789',
        required: false
    })
    googleId?: string;
}