import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { walletPassConfig } from '../config/wallet-pass.config.js';
import { WalletPassController } from './wallet-pass.controller.js';
import { WalletPassService } from './wallet-pass.service.js';

@Module({
  imports: [ConfigModule.forFeature(walletPassConfig)],
  controllers: [WalletPassController],
  providers: [WalletPassService],
  exports: [WalletPassService],
})
export class WalletPassModule {}
