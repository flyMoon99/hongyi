import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { PrismaService } from '../prisma/prisma.service'
import { LoginDto } from './dto/login.dto'
import * as svgCaptcha from 'svg-captcha'

@Injectable()
export class AuthService {
  private captchaStore = new Map<string, { text: string; expires: number }>()

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  generateCaptcha(sessionId: string) {
    const captcha = svgCaptcha.create({
      size: 4,
      noise: 2,
      color: true,
      background: '#f0f0f0',
    })
    this.captchaStore.set(sessionId, {
      text: captcha.text.toLowerCase(),
      expires: Date.now() + 5 * 60 * 1000,
    })
    return { svg: captcha.data, sessionId }
  }

  async login(dto: LoginDto) {
    const stored = this.captchaStore.get(dto.sessionId)
    if (!stored || stored.expires < Date.now()) {
      throw new UnauthorizedException('验证码已过期')
    }
    if (stored.text !== dto.captcha.toLowerCase()) {
      throw new UnauthorizedException('验证码错误')
    }
    this.captchaStore.delete(dto.sessionId)

    const employee = await this.prisma.employee.findUnique({
      where: { phone: dto.phone },
    })
    if (!employee) throw new UnauthorizedException('手机号或密码错误')

    const valid = await bcrypt.compare(dto.password, employee.password)
    if (!valid) throw new UnauthorizedException('手机号或密码错误')

    const payload = { sub: employee.id, phone: employee.phone, isAdmin: employee.isAdmin }
    const accessToken = this.jwt.sign(payload)

    return {
      accessToken,
      employee: {
        id: employee.id,
        name: employee.name,
        phone: employee.phone,
        email: employee.email,
        avatar: employee.avatar,
        isAdmin: employee.isAdmin,
        gender: employee.gender,
      },
    }
  }
}
