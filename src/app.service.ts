import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name)

  constructor(private readonly configService: ConfigService) {}

  getHello(): string {
    return 'Hello World!'
  }

  getDatabase() {
    // Cambia 'database' por la clave completa
    const dbHost = this.configService.get<string>('database.host')
    const dbPort = this.configService.get<number>('database.port')
    const dbUser = this.configService.get<string>('database.username')
    const dbName = this.configService.get<string>('database.name')

    this.logger.log(
      `DB Host: ${dbHost}, DB Port: ${dbPort}, DB Name: ${dbName}`
    )

    return { dbHost, dbName, dbPort, dbUser }
  }
}
