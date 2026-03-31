import { Controller, Post, Body, Get, Query, Res } from '@nestjs/common'
import { Response } from 'express'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { Public } from '../common/public.decorator'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Get('captcha')
  getCaptcha(@Query('sessionId') sessionId: string, @Res() res: Response) {
    const result = this.authService.generateCaptcha(sessionId || Date.now().toString())
    res.setHeader('Content-Type', 'application/json')
    res.json({ code: 0, message: 'success', data: result })
  }

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto)
  }
}
