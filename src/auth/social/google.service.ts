import { Injectable, UnauthorizedException } from '@nestjs/common';
import { User } from '../../users/schemas/user.schema';
import { UsersService } from '../../users/users.service';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleService {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  async validateGoogleLogin(googleTokenData: any) {
    // If googleTokenData contains a token, we need to verify it with Google
    if (googleTokenData.token) {
      // In a real implementation, you would verify the token with Google's API
      // For now, we'll simulate getting user data from the token
      const googleUser = await this.authService.verifyGoogleToken(googleTokenData.token);
      return this.authService.socialLogin({
        id: googleUser.googleId,
        email: googleUser.email,
        name: googleUser.name,
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
      }, 'google');
    } else {
      // If googleTokenData is already a user object (for backward compatibility)
      return this.authService.socialLogin({
        id: googleTokenData.googleId,
        email: googleTokenData.email,
        name: googleTokenData.name,
        firstName: googleTokenData.firstName,
        lastName: googleTokenData.lastName,
      }, 'google');
    }
  }
}