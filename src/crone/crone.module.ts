import { Module } from '@nestjs/common';
import { CroneService } from './crone.service';
import { ScheduleModule } from '@nestjs/schedule';
import { FirebaseService } from 'src/firebase/firebase.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [CroneService, FirebaseService],
  exports: [CroneService],
})
export class CroneModule {}
