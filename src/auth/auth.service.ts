import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { UsersService } from '../users/users.service';
import { User } from '../users/schemas/user.schema';
import * as bcrypt from 'bcrypt';
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
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
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

    const hashedPassword = await this.hashPassword(registerDto.password);
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
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
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '1h',
      }),
      refresh_token: this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
      user: {
        id: user._id?.toString() || '',
        username: user.username,
        email: user.email,
        role: user.role,
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
      },
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const newPayload = {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      return {
        access_token: this.jwtService.sign(newPayload),
        refresh_token: this.jwtService.sign(newPayload, {
          secret: process.env.JWT_REFRESH_SECRET,
          expiresIn: '7d',
        }),
      };
    } catch (e) {
      throw new Error('Invalid refresh token');
    }
  }

  async googleLogin(googleTokenData: any) {
    // If googleTokenData contains a token, we need to verify it with Google
    if (googleTokenData.token) {
      // In a real implementation, you would verify the token with Google's API
      // For now, we'll simulate getting user data from the token
      const googleUser = await this.verifyGoogleToken(googleTokenData.token);
      return this.processGoogleUser(googleUser);
    } else {
      // If googleTokenData is already a user object (for backward compatibility)
      return this.processGoogleUser(googleTokenData);
    }
  }

  private async verifyGoogleToken(token: string) {
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

  private async processGoogleUser(googleUser: any) {
    // Ensure we have the required data from Google profile
    if (!googleUser.email) {
      throw new UnauthorizedException('Google profile does not contain email');
    }

    let user = await this.usersService.findByEmail(googleUser.email);

    // create user if not exists
    if (!user) {
      // Generate a username if not available from Google profile
      let username = googleUser.name || googleUser.displayName;
      if (!username) {
        // Extract username from email if no display name is available
        username = googleUser.email.split('@')[0];
      }

      // If we have first and last name, use them to create a more descriptive username
      if (googleUser.firstName && googleUser.lastName) {
        username = `${googleUser.firstName} ${googleUser.lastName}`;
      } else if (googleUser.firstName) {
        username = googleUser.firstName;
      } else if (googleUser.lastName) {
        username = googleUser.lastName;
      }

      const createdUser = await this.usersService.create({
        username: username,
        email: googleUser.email,
        password: await this.hashPassword(Math.random().toString(36).slice(-8)), // Generate a random password for OAuth users
        role: 'user',
        googleId: googleUser.googleId || null,
      });

      // Convert the created user to a plain object to match the expected type
      user = await this.usersService.findByEmail(googleUser.email);
    }

    // Check if user is still null after creation attempt
    if (!user) {
      throw new UnauthorizedException('Failed to create or retrieve user');
    }

    const payload = {
      sub: user._id?.toString(),
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '1h',
      }),
      refresh_token: this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
      user: {
        id: user._id?.toString() || '',
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  async facebookLogin(fbTokenData: any) {
    // If fbTokenData contains an accessToken, we need to verify it with Facebook
    if (fbTokenData.accessToken) {
      // In a real implementation, you would verify the token with Facebook's API
      // For now, we'll simulate getting user data from the token
      const fbUser = await this.verifyFacebookToken(fbTokenData.accessToken);
      return this.processFacebookUser(fbUser);
    } else {
      // If fbTokenData is already a user object (for backward compatibility)
      return this.processFacebookUser(fbTokenData);
    }
  }

  private async verifyFacebookToken(accessToken: string) {
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

  private async processFacebookUser(fbUser: any) {
    let user = await this.usersService.findByEmail(
      fbUser.email,
    );

    if (!user) {
      user = await this.usersService.create({
        name: fbUser.name,
        email: fbUser.email,
        password: await this.hashPassword(Math.random().toString(36).slice(-8)), // Generate a random password for OAuth users
        role: 'user',
        facebookId: fbUser.facebookId,
      });
    }

    const payload = {
      sub: user._id?.toString(),
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '1h',
      }),
      refresh_token: this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
      user: {
        id: user._id?.toString() || '',
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

}
