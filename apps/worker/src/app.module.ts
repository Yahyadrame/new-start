import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { ENV, parseEnv } from './config/env.js';
import { JobsModule } from './modules/jobs/jobs.module.js';

@Module({
  imports: [
    LoggerModule.forRoot({ pinoHttp: { level: parseEnv(process.env).LOG_LEVEL } }),
    JobsModule,
  ],
  providers: [{ provide: ENV, useFactory: () => parseEnv(process.env) }],
})
export class AppModule {}
