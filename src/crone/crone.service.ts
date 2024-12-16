import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FirebaseService } from 'src/firebase/firebase.service';

@Injectable()
export class CroneService {
  private readonly logger = new Logger(CroneService.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  @Cron('0 9 * * *', { timeZone: 'America/Guayaquil' })
  async handleCron() {
    this.logger.log(
      'CRON EJECUTADO CADA 1 MINUTOS EN CRONE MODULE AHORA CON LOS DATOS',
    );
    try {
      await this.firebaseService.deleteNonExpiredCodes();
      this.logger.log('Documentos no expirados eliminados correctamente.');
    } catch (error) {
      this.logger.error('Error al ejecutar el CRON:', error);
    }
  }
}
