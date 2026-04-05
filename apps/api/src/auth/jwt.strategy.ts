import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET'),
    })
  }

  async validate(payload: any) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        phone: true,
        role: true,
        isDeleted: true,
        tokenVersion: true,
      },
    })

    if (!employee || employee.isDeleted) {
      throw new UnauthorizedException('用户不存在或已被禁用')
    }

    if (payload.tokenVersion !== employee.tokenVersion) {
      throw new UnauthorizedException('登录状态已失效，请重新登录')
    }

    return { id: employee.id, phone: employee.phone, role: employee.role }
  }
}
