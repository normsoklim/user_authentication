import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleService } from './social/google.service';
import { FacebookService } from './social/facebook.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { GoogleStrategy } from './strategies/google.strategy/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy/facebook.strategy';
@Module({
  imports: [
    UsersModule,
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret') || 'default_secret',
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    AuthService,
    GoogleService,
    FacebookService,
    {
      provide: JwtStrategy,
      useFactory: (configService: ConfigService, usersService: UsersService) => {
        return new JwtStrategy(configService, usersService);
      },
      inject: [ConfigService, UsersService],
    },
    GoogleStrategy,
    FacebookStrategy,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
