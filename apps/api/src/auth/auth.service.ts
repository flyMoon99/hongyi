import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { PrismaService } from '../prisma/prisma.service'
import { LoginDto } from './dto/login.dto'
import { UpdateMeDto } from './dto/update-me.dto'
import { ChangePasswordDto } from './dto/change-password.dto'

const SAFE_SELECT = {
  id: true,
  name: true,
  gender: true,
  phone: true,
  avatar: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const employee = await this.prisma.employee.findUnique({
      where: { phone: dto.phone },
    })
    if (!employee || employee.isDeleted) {
      throw new UnauthorizedException('该手机号未注册，请确认后重试')
    }

    const valid = await bcrypt.compare(dto.password, employee.password)
    if (!valid) throw new UnauthorizedException('密码错误，请重新输入')

    const payload = {
      sub: employee.id,
      phone: employee.phone,
      role: employee.role,
      tokenVersion: employee.tokenVersion,
    }
    const accessToken = this.jwt.sign(payload)

    return {
      accessToken,
      employee: {
        id: employee.id,
        name: employee.name,
        phone: employee.phone,
        email: employee.email,
        avatar: employee.avatar,
        role: employee.role,
        gender: employee.gender,
      },
    }
  }

  async getMe(userId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: userId },
      select: SAFE_SELECT,
    })
    if (!employee) throw new UnauthorizedException('用户不存在')
    return employee
  }

  async updateMe(userId: string, dto: UpdateMeDto) {
    return this.prisma.employee.update({
      where: { id: userId },
      data: dto,
      select: SAFE_SELECT,
    })
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const employee = await this.prisma.employee.findUnique({ where: { id: userId } })
    if (!employee) throw new UnauthorizedException('用户不存在')

    const valid = await bcrypt.compare(dto.currentPassword, employee.password)
    if (!valid) throw new UnauthorizedException('当前密码错误')

    const hashed = await bcrypt.hash(dto.newPassword, 10)
    await this.prisma.employee.update({
      where: { id: userId },
      data: {
        password: hashed,
        tokenVersion: { increment: 1 },
      },
    })

    await this.prisma.employeeLog.create({
      data: {
        employeeId: userId,
        operatorId: userId,
        action: '修改密码',
        detail: '用户自行修改登录密码',
      },
    })

    return { message: '密码修改成功' }
  }
}
