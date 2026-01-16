import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BlockchainModule } from './blockchain/blockchain.module';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [BlockchainModule],
})
export class AppModule {}
