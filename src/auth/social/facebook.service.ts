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
    if (fbTokenData.accessToken) {
      const fbUser = await this.authService.verifyFacebookToken(
        fbTokenData.accessToken,
      );
      return this.authService.socialLogin(
        {
          id: fbUser.facebookId,
          email: fbUser.email,
          name: fbUser.name,
        },
        'facebook',
      );
    } else {
      return this.authService.socialLogin(
        {
          id: fbTokenData.facebookId,
          email: fbTokenData.email,
          name: fbTokenData.name,
        },
        'facebook',
      );
    }
  }
}
