import { Module } from '@nestjs/common';
import { AccessTokenGuard } from '../auth/access-token.guard.js';
import { AuthModule } from '../auth/auth.module.js';
import { BnccController } from './bncc.controller.js';
import { BnccService } from './bncc.service.js';

@Module({ imports: [AuthModule], controllers: [BnccController], providers: [BnccService, AccessTokenGuard] })
export class BnccModule {}
