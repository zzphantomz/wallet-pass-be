import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WalletPassModule } from './wallet-pass/wallet-pass.module.js';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), WalletPassModule],
})
export class AppModule {}
