import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

/**
 * 权限矩阵（角色 × 公司）：
 *   ADMIN           null          → 仅员工管理读写；其余模块 403
 *   DEPT_MANAGER    HAODING_HONGYI → 员工(本公司)读写、客户/巡检/试验读写；站室/消防巡检 403
 *   STAFF           HAODING_HONGYI → 客户/巡检/试验只读；其余 403
 *   DEPT_MANAGER    STATE_GRID    → 员工(本公司)读写、站室/消防巡检读写；客户/巡检/试验 403
 *   STAFF           STATE_GRID    → 站室/消防巡检只读；其余 403
 *
 * 使用方式：在 Controller 的写操作方法上加 @UseGuards(CompanyRoleGuard)
 * 并通过 @RequireModule('customers') 指定模块名称（可选）。
 */

export const MODULE_KEY = 'crg_module'

import { SetMetadata } from '@nestjs/common'
export const RequireModule = (mod: string) => SetMetadata(MODULE_KEY, mod)

/** 模块归属：哪些公司可以写（DEPT_MANAGER）、哪些可以读（STAFF）*/
const MODULE_POLICY: Record<string, { write: string[]; read: string[] }> = {
  employees: { write: ['HAODING_HONGYI', 'STATE_GRID', 'ADMIN'], read: [] },
  customers: { write: ['HAODING_HONGYI'], read: ['HAODING_HONGYI'] },
  inspections: { write: ['HAODING_HONGYI'], read: ['HAODING_HONGYI'] },
  experiments: { write: ['HAODING_HONGYI'], read: ['HAODING_HONGYI'] },
  'station-rooms': { write: ['STATE_GRID'], read: ['STATE_GRID'] },
  'fire-inspections': { write: ['STATE_GRID'], read: ['STATE_GRID'] },
}

@Injectable()
export class CompanyRoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const mod = this.reflector.getAllAndOverride<string>(MODULE_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    const request = context.switchToHttp().getRequest()
    const user = request.user

    if (!user) throw new ForbiddenException('未登录')

    const { role, company } = user
    const method = request.method as string
    const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)

    // 超管：只允许员工模块（或未指定模块），禁止所有其他业务模块
    if (role === 'ADMIN') {
      if (mod && mod !== 'employees') {
        throw new ForbiddenException('管理员仅可访问员工管理')
      }
      return true
    }

    const policy = mod ? MODULE_POLICY[mod] : null

    if (!policy) {
      // 未指定模块，非超管一律拒绝
      throw new ForbiddenException('权限不足')
    }

    const companyStr = company ?? ''

    if (isWrite) {
      if (role !== 'DEPT_MANAGER' || !policy.write.includes(companyStr)) {
        throw new ForbiddenException('权限不足：无法执行写操作')
      }
      return true
    }

    // 读操作（GET）
    if (role === 'DEPT_MANAGER' && policy.write.includes(companyStr)) return true
    if (role === 'STAFF' && policy.read.includes(companyStr)) return true

    throw new ForbiddenException('权限不足')
  }
}
