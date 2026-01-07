import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GovtoolsOAuthProvider } from './providers/govtools-oauth.provider';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [],
  controllers: [AuthController],
  providers: [AuthService, GovtoolsOAuthProvider, JwtStrategy],
})
export class AuthModule {}
