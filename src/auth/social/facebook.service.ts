import { Injectable, UnauthorizedException } from '@nestjs/common';
import { User } from '../../users/schemas/user.schema';
import { UsersService } from '../../users/users.service';
import { AuthService } from '../auth.service';

@Injectable()
export class FacebookService {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  async validateFacebookLogin(fbTokenData: any) {
    // If fbTokenData contains an accessToken, we need to verify it with Facebook
    if (fbTokenData.accessToken) {
      // In a real implementation, you would verify the token with Facebook's API
      // For now, we'll simulate getting user data from the token
      const fbUser = await this.authService.verifyFacebookToken(fbTokenData.accessToken);
      return this.authService.socialLogin({
        id: fbUser.facebookId,
        email: fbUser.email,
        name: fbUser.name,
      }, 'facebook');
    } else {
      // If fbTokenData is already a user object (for backward compatibility)
      return this.authService.socialLogin({
        id: fbTokenData.facebookId,
        email: fbTokenData.email,
        name: fbTokenData.name,
      }, 'facebook');
    }
  }
}