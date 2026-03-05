import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(
  Strategy,
  'google',
) {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '',
      scope: ['email', 'profile'],
      passReqToCallback: true,
    });
  }

  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ) {
    return {
      email: profile && profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null,
      name: profile && profile.displayName ? profile.displayName :
        (profile.name && profile.name.givenName && profile.name.familyName ?
          `${profile.name.givenName} ${profile.name.familyName}` :
          profile.displayName),
      googleId: profile && profile.id ? profile.id : null,
      firstName: profile && profile.name && profile.name.givenName ? profile.name.givenName : null,
      lastName: profile && profile.name && profile.name.familyName ? profile.name.familyName : null,
    };
  }
}