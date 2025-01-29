import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { VerifyDRepSignatureDto } from './auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  @Post('session')
  async getSession(@Body('payload') payload: any) {
    return this.authService.getSession(payload);
  }
  @Post('login')
  async login(@Body() payload: any) {
    const { expiry, ...authPayload } = payload;
    return this.authService.login(authPayload, expiry);
  }
  @Post('signatures/verify')
  async verifySignature(@Body() payload: VerifyDRepSignatureDto) {
    return this.authService.verifySignature(payload);
  }
  @Post('witnesses/verify')
  async verifyWitness(
    @Body()
    payload: {
      witnessSet: {
        vkey: string;
        signature: string;
      };
      address: string;
    },
  ) {
    return this.authService.verifyTxWitness(payload);
  }
}
