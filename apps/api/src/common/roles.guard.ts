import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const user = request.user
    if (!user || (user.role !== 'ADMIN' && user.role !== 'DEPT_MANAGER')) {
      throw new ForbiddenException('需要管理员或部门负责人权限')
    }
    return true
  }
}
