import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { User } from '../users/schemas/user.schema';
import { HashUtil } from '../utils/hash.util';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    provider: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && user.password && await HashUtil.comparePassword(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async register(registerDto: RegisterDto): Promise<{ message: string, data: Omit<RegisterDto, 'password'> }> {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await HashUtil.hashPassword(registerDto.password);
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
      provider: 'local',
    });

    return {
      message: 'User registered successfully',
      data: {
        username: user.username,
        email: user.email,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user._id?.toString(),
      email: user.email,
      role: user.role
    };

    return {
      access_token: this.jwtService.sign(payload, {
        secret: this.configService.get<string>('jwt.secret') || 'default_secret',
        expiresIn: '1h',
      }),
      refresh_token: this.jwtService.sign(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret') || 'default_refresh_secret',
        expiresIn: '7d',
      }),
      user: {
        id: user._id?.toString() || '',
        username: user.username,
        email: user.email,
        role: user.role,
        provider: user.provider,
      },
    };
  }


  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Return user profile without password
    const { password, ...result } = user;
    return {
      access_token: '', // Empty string instead of null to match AuthResponseDto
      user: {
        id: result._id?.toString(),
        username: result.username,
        email: result.email,
        role: result.role,
        provider: result.provider,
      },
    };
  }

  async refreshToken(token: string): Promise<AuthResponse> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const newPayload = {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      // Get user info to include in the response
      const user = await this.usersService.findById(payload.sub);
      
      return {
        access_token: this.jwtService.sign(newPayload),
        refresh_token: this.jwtService.sign(newPayload, {
          secret: this.configService.get<string>('jwt.refreshSecret'),
          expiresIn: '7d',
        }),
        user: {
          id: user?._id?.toString() || payload.sub,
          username: user?.username || '',
          email: user?.email || payload.email,
          role: user?.role || payload.role,
          provider: user?.provider || 'local',
        },
      };
    } catch (e) {
      throw new Error('Invalid refresh token');
    }
  }

  async socialLogin(profile: any, provider: 'google' | 'facebook') {
    let user = await this.usersService.findByEmail(profile.email);

    if (!user) {
      // Generate a username if not available from profile
      let username = profile.name || profile.displayName;
      if (!username) {
        // Extract username from email if no display name is available
        username = profile.email.split('@')[0];
      }

      // If we have first and last name, use them to create a more descriptive username
      if (profile.firstName && profile.lastName) {
        username = `${profile.firstName} ${profile.lastName}`;
      } else if (profile.firstName) {
        username = profile.firstName;
      } else if (profile.lastName) {
        username = profile.lastName;
      }

      user = await this.usersService.create({
        username: username,
        email: profile.email,
        password: await HashUtil.hashPassword(Math.random().toString(36).slice(-8)), // Generate a random password for OAuth users
        provider: provider,
        providerId: profile.id,
        role: 'user',
      });
    }

    const payload = {
      sub: user._id?.toString(),
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload, {
        secret: this.configService.get<string>('jwt.secret') || 'default_secret',
        expiresIn: '1h',
      }),
      refresh_token: this.jwtService.sign(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret') || 'default_refresh_secret',
        expiresIn: '7d',
      }),
      user: {
        id: user._id?.toString() || '',
        username: user.username,
        email: user.email,
        role: user.role,
        provider: user.provider,
      },
    };
  }

  async verifyGoogleToken(token: string) {
    // This is a placeholder implementation
    // In a real application, you would call Google's token verification API
    // For example: https://oauth2.googleapis.com/tokeninfo?id_token=token
    // For now, we'll simulate a successful verification
    try {
      // In a real implementation, you would decode and verify the JWT token
      // For this example, we'll return a mock user object
      // You should replace this with actual Google token verification
      return {
        email: 'user@example.com', // This would come from the verified token
        name: 'Test User',         // This would come from the verified token
        googleId: '123456789',     // This would come from the verified token
        firstName: 'Test',         // This would come from the verified token
        lastName: 'User',          // This would come from the verified token
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid Google token');
    }
  }

  async verifyFacebookToken(accessToken: string) {
    // This is a placeholder implementation
    // In a real application, you would call Facebook's token verification API
    // For example: https://graph.facebook.com/me?access_token=accessToken
    // For now, we'll simulate a successful verification
    try {
      // In a real implementation, you would call Facebook's API to get user info
      // For this example, we'll return a mock user object
      // You should replace this with actual Facebook token verification
      return {
        email: 'user@example.com', // This would come from the verified token
        name: 'Test User',         // This would come from the verified token
        facebookId: '123456789',   // This would come from the verified token
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid Facebook token');
    }
  }

}
