import { Controller, Post, Body, Get, UseGuards, Req, Request, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleService } from './social/google.service';
import { FacebookService } from './social/facebook.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly googleService: GoogleService,
        private readonly facebookService: FacebookService,
    ) { }

    @Post('register')
    async register(@Body() registerDto: RegisterDto): Promise<{ message: string, data: Omit<RegisterDto, 'password'> }> {
        return this.authService.register(registerDto);
    }

    @Post('login')
    async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
        return this.authService.login(loginDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@Request() req) {
        return req.user;
    }
    @Post('refresh')
    refresh(@Body('refresh_token') token: string) {
        return this.authService.refreshToken(token);
    }

    @Get('google')
    @UseGuards(AuthGuard('google'))
    async googleAuth() { }


    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    googleAuthRedirect(@Req() req) {
        return this.googleService.validateGoogleLogin(req.user);
    }

    @Post('google')
    async googleLogin(@Body('token') token: string) {
      const profile = await this.authService.verifyGoogleToken(token);
      return this.authService.socialLogin(
        {
          id: profile.googleId,
          email: profile.email,
          name: profile.name,
        },
        'google',
      );
    }

    @Post('facebook')
    async facebookLoginPost(@Body('token') token: string) {
      const profile = await this.authService.verifyFacebookToken(token);
      return this.authService.socialLogin(
        {
          id: profile.facebookId,
          email: profile.email,
          name: profile.name,
        },
        'facebook',
      );
    }
    
    @Get('facebook')
    @UseGuards(AuthGuard('facebook'))
    facebookLogin() { }

    @Get('facebook/callback')
    @UseGuards(AuthGuard('facebook'))
    facebookAuthRedirect(@Req() req) {
        return this.facebookService.validateFacebookLogin(req.user);
    }
    
    @Get('admin-dashboard')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    getAdminDashboard() {
      return 'Admin only data';
    }
    
    @Get('orders')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'staff')
    getOrders() {
      return 'Staff and admin can access';
    }
  @Get('verify-email')
  @Public()
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('forgot-password')
  forgotPassword(@Body('email') email: string) {
  return this.authService.forgotPassword(email);
}

  @Post('reset-password')
  resetPassword(
    @Body('token') token: string,
    @Body('password') password: string,
  ) {
    return this.authService.resetPassword(token, password);
  }
}
