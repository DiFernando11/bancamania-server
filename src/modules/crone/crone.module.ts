import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { FirebaseService } from 'src/modules/firebase/firebase.service'
import { CroneService } from './crone.service'

@Module({
  exports: [CroneService],
  imports: [ScheduleModule.forRoot()],
  providers: [CroneService, FirebaseService],
})
export class CroneModule {}
