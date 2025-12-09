import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      name: 'default',
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'web_db'),
        port: +configService.get('DATABASE_PORT', 5432),
        username: configService.get('DATABASE_USERNAME', 'voltaire'),
        password: configService.get('DATABASE_PASSWORD', 'postgres'),
        database: configService.get('DATABASE_NAME', '1694'),
        entities: [
          __dirname + '/entities/*.entity.{ts,js}',
          __dirname + '/entities/governance/*.entity.{ts,js}'
        ],
        synchronize: false,
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        migrationsRun: process.env.NODE_ENV !== 'development',
        logging: process.env.NODE_ENV === 'development',
        retryAttempts: 5,
        retryDelay: 3000,
      }),
    }),
  ],
})
export class DbModule {}