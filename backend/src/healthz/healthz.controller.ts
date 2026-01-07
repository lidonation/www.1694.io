import { Controller, Get } from '@nestjs/common';

@Controller('healthz')
export class HealthzController {
  constructor() {}
  @Get('/live')
  getLiveliness() {
    return true;
  }
  @Get('/ready')
  getReadiness() {
    return true;
  }

  @Get('memory')
  getMemoryUsage() {
    const memUsage = process.memoryUsage();

    return {
      timestamp: new Date().toISOString(),
      memory: {
        rss: this.formatBytes(memUsage.rss), // Resident Set Size
        heapTotal: this.formatBytes(memUsage.heapTotal), // Total heap
        heapUsed: this.formatBytes(memUsage.heapUsed), // Used heap
        external: this.formatBytes(memUsage.external), // External memory
        arrayBuffers: this.formatBytes(memUsage.arrayBuffers),
      },
      raw: memUsage, // Raw numbers for programmatic use
    };
  }

  private formatBytes(bytes: number): string {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  }
}
