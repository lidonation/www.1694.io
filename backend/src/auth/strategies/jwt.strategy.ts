import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../auth.dto';
import { Signature } from 'src/entities/signatures.entity';
import { customAuthHeaderExtractor } from '../extractors/extractFromCustomAuthHeader';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectDataSource('default')
    private voltaireService: DataSource,
    private configService: ConfigService
  ) {
    super({
      jwtFromRequest: customAuthHeaderExtractor,
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const signature = await this.voltaireService
      .getRepository<Signature>('Signature')
      .findOne({
        where: { 
          id: payload.sub,
          stakeKey: payload.stakeKey 
        }
      });

    if (!signature) {
      throw new UnauthorizedException('Invalid token - signature not found');
    }

    return signature;
  }
}
