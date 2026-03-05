import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';

@Injectable()
export class FacebookStrategy extends PassportStrategy(
  Strategy,
  'facebook',
) {
  constructor() {
    const clientID = process.env.FACEBOOK_APP_ID;
    const clientSecret = process.env.FACEBOOK_APP_SECRET;
    const callbackURL = process.env.FACEBOOK_CALLBACK_URL;

    if (!clientID) {
      throw new Error('FACEBOOK_APP_ID is not defined in environment variables');
    }
    if (!clientSecret) {
      throw new Error('FACEBOOK_APP_SECRET is not defined in environment variables');
    }
    if (!callbackURL) {
      throw new Error('FACEBOOK_CALLBACK_URL is not defined in environment variables');
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      profileFields: ['id', 'emails', 'name', 'displayName'],
      scope: ['email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ) {
    return {
      email: profile.emails?.[0]?.value,
      name: profile.displayName,
      facebookId: profile.id,
    };
  }
}