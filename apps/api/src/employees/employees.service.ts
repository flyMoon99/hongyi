import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import { Company, UserRole } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateEmployeeDto } from './dto/create-employee.dto'
import { UpdateEmployeeDto } from './dto/update-employee.dto'

const SAFE_SELECT = {
  id: true,
  name: true,
  gender: true,
  phone: true,
  avatar: true,
  email: true,
  role: true,
  company: true,
  isDeleted: true,
  createdAt: true,
  updatedAt: true,
}

interface OperatorUser {
  id: string
  role: UserRole
  company: Company | null
}

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  private ensureCanAssignRole(operatorRole: UserRole, targetRole: UserRole) {
    if (operatorRole !== 'ADMIN' && targetRole !== 'STAFF') {
      throw new ForbiddenException('只有管理员可以设置管理员或部门负责人角色')
    }
  }

  private ensureCanManageTarget(operator: OperatorUser, target: { role: UserRole; company: Company | null }) {
    if (operator.role === 'ADMIN') return
    if (operator.role !== 'DEPT_MANAGER') throw new ForbiddenException('权限不足')
    if (target.role !== 'STAFF') throw new ForbiddenException('部门负责人只能管理职员账号')
    if (target.company !== operator.company) throw new ForbiddenException('无权操作其他公司员工')
  }

  async findAll(page = 1, pageSize = 10, search?: string, company?: Company, operator?: OperatorUser) {
    const where: any = { isDeleted: false }

    // 非超管只能看本公司
    if (operator && operator.role !== 'ADMIN') {
      where.company = operator.company
    } else if (company) {
      // 超管可以按公司筛选
      where.company = company
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
      ]
    }
    const [items, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: SAFE_SELECT,
      }),
      this.prisma.employee.count({ where }),
    ])
    return { items, total, page, pageSize }
  }

  async findOne(id: string, requester: OperatorUser) {
    const canSeeAll = requester.role === 'ADMIN' || requester.role === 'DEPT_MANAGER'
    if (!canSeeAll && requester.id !== id) {
      throw new ForbiddenException('无权查看该员工信息')
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id },
      select: {
        ...SAFE_SELECT,
        employeeLogs: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: {
            id: true,
            action: true,
            detail: true,
            createdAt: true,
            operator: { select: { id: true, name: true } },
          },
        },
      },
    })
    if (!employee || employee.isDeleted) throw new NotFoundException('员工不存在')

    // 部门负责人只能查看本公司员工
    if (requester.role === 'DEPT_MANAGER' && employee.company !== requester.company) {
      throw new ForbiddenException('无权查看其他公司员工信息')
    }

    return employee
  }

  /** 检查手机号是否属于已软删除员工，是则返回该员工信息，否则返回 null */
  async checkDeletedByPhone(phone: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { phone },
      select: { ...SAFE_SELECT, isDeleted: true },
    })
    if (!employee || !employee.isDeleted) return null
    return employee
  }

  /** 恢复已软删除的员工账号，同时允许更新部分信息 */
  async restore(
    id: string,
    dto: { name?: string; password?: string; role?: UserRole; company?: Company | null },
    operator: OperatorUser,
  ) {
    const existing = await this.prisma.employee.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException('员工不存在')
    if (!existing.isDeleted) throw new ConflictException('该员工账号仍然有效，无需恢复')

    this.ensureCanAssignRole(operator.role, dto.role ?? existing.role)

    const data: any = {
      isDeleted: false,
      deletedAt: null,
      tokenVersion: { increment: 1 },
    }
    if (dto.name) data.name = dto.name
    if (dto.role) data.role = dto.role
    if (dto.password) data.password = await bcrypt.hash(dto.password, 10)
    if (dto.company !== undefined) {
      data.company = operator.role === 'DEPT_MANAGER' ? operator.company : dto.company
    }

    const employee = await this.prisma.employee.update({
      where: { id },
      data,
      select: SAFE_SELECT,
    })
    await this.prisma.employeeLog.create({
      data: {
        employeeId: id,
        operatorId: operator.id,
        action: '恢复员工',
        detail: `恢复员工账号：${employee.name}（${employee.phone}）`,
      },
    })
    return employee
  }

  async create(dto: CreateEmployeeDto, operator: OperatorUser) {
    const existing = await this.prisma.employee.findUnique({ where: { phone: dto.phone } })
    if (existing && !existing.isDeleted) throw new ConflictException('手机号已存在')
    if (existing && existing.isDeleted) throw new ConflictException('DELETED:' + existing.id)

    this.ensureCanAssignRole(operator.role, dto.role ?? 'STAFF')

    // 部门负责人强制写入本公司
    let company = dto.company
    if (operator.role === 'DEPT_MANAGER') {
      company = operator.company ?? undefined
    }
    if (operator.role !== 'ADMIN' && !company) {
      throw new ForbiddenException('所属公司不能为空')
    }

    const hashed = await bcrypt.hash(dto.password, 10)
    const employee = await this.prisma.employee.create({
      data: { ...dto, password: hashed, company: company ?? null },
      select: SAFE_SELECT,
    })
    await this.prisma.employeeLog.create({
      data: {
        employeeId: employee.id,
        operatorId: operator.id,
        action: '新增员工',
        detail: `新增员工：${employee.name}（${employee.phone}）`,
      },
    })
    return employee
  }

  async update(id: string, dto: UpdateEmployeeDto, operator: OperatorUser) {
    const existing = await this.prisma.employee.findUnique({ where: { id } })
    if (!existing || existing.isDeleted) throw new NotFoundException('员工不存在')

    this.ensureCanManageTarget(operator, existing)

    if (dto.role) {
      this.ensureCanAssignRole(operator.role, dto.role)
    }

    // 部门负责人不能修改公司归属
    if (operator.role === 'DEPT_MANAGER') {
      delete dto.company
    }

    if (dto.phone) {
      const dup = await this.prisma.employee.findFirst({
        where: { phone: dto.phone, NOT: { id } },
      })
      if (dup) throw new ConflictException('手机号已存在')
    }

    const data: any = { ...dto }
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10)
    } else {
      delete data.password
    }

    if (dto.role || dto.password) {
      data.tokenVersion = { increment: 1 }
    }

    const employee = await this.prisma.employee.update({
      where: { id },
      data,
      select: SAFE_SELECT,
    })

    await this.prisma.employeeLog.create({
      data: {
        employeeId: id,
        operatorId: operator.id,
        action: '修改员工',
        detail: `修改员工信息：${employee.name}`,
      },
    })
    return employee
  }

  async remove(id: string, operator: OperatorUser) {
    const existing = await this.prisma.employee.findUnique({ where: { id } })
    if (!existing || existing.isDeleted) throw new NotFoundException('员工不存在')

    this.ensureCanManageTarget(operator, existing)

    await this.prisma.employee.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        tokenVersion: { increment: 1 },
      },
    })

    await this.prisma.employeeLog.create({
      data: {
        employeeId: id,
        operatorId: operator.id,
        action: '删除员工',
        detail: `删除员工：${existing.name}（${existing.phone}）`,
      },
    })

    return { message: '删除成功' }
  }

  async resetPassword(id: string, newPassword: string, operatorId: string) {
    const existing = await this.prisma.employee.findUnique({ where: { id } })
    if (!existing || existing.isDeleted) throw new NotFoundException('员工不存在')
    const hashed = await bcrypt.hash(newPassword, 10)
    await this.prisma.employee.update({
      where: { id },
      data: {
        password: hashed,
        tokenVersion: { increment: 1 },
      },
    })
    await this.prisma.employeeLog.create({
      data: {
        employeeId: id,
        operatorId,
        action: '重置密码',
        detail: `管理员为员工 ${existing.name} 重置了密码`,
      },
    })
    return { message: '密码重置成功' }
  }
}
