import { Controller, Post, Body, Get, UseGuards, Req, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { JwtAuthGuard } from './auth.guard';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

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
        return this.authService.googleLogin(req.user);
    }

    @Get('facebook')
    @UseGuards(AuthGuard('facebook'))
    facebookLogin() { }

    @Get('facebook/callback')
    @UseGuards(AuthGuard('facebook'))
    facebookAuthRedirect(@Req() req) {
        return this.authService.facebookLogin(req.user);
    }}
