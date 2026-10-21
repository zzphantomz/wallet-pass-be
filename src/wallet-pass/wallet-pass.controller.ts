import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  ParseEnumPipe,
  Post,
  Query,
  StreamableFile,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { walletPassConfig } from '../config/wallet-pass.config.js';
import { TicketDetailDto } from './dto/ticket-detail.dto.js';
import { PassTier } from './pass-tier.js';
import { WalletPassService } from './wallet-pass.service.js';

const PKPASS_MIME = 'application/vnd.apple.pkpass';
const tierPipe = new ParseEnumPipe(PassTier, { optional: true });

@Controller('v1/wallet-pass')
export class WalletPassController {
  constructor(
    private readonly walletPass: WalletPassService,
    @Inject(walletPassConfig.KEY)
    private readonly config: ConfigType<typeof walletPassConfig>,
  ) {}

  @Post()
  @HttpCode(200)
  async create(
    @Body() ticket: TicketDetailDto,
    @Query('tier', tierPipe) tier?: PassTier,
  ) {
    return this.toFile(ticket, tier);
  }

  /** For `PassKit.addPass(base64)` in react-native-wallet-pass. */
  @Post('base64')
  @HttpCode(200)
  async createBase64(
    @Body() ticket: TicketDetailDto,
    @Query('tier', tierPipe) tier?: PassTier,
  ) {
    const buffer = await this.walletPass.generate(ticket, tier);
    return {
      fileName: `${ticket.code}.pkpass`,
      pkpass: buffer.toString('base64'),
    };
  }

  /** Signs the bundled sample ticket, handy for testing on a device. */
  @Get('sample')
  async sample(@Query('tier', tierPipe) tier?: PassTier) {
    const file = path.resolve(this.config.assetsDir, 'sample-ticket.json');
    const ticket = JSON.parse(await readFile(file, 'utf8')) as TicketDetailDto;
    return this.toFile(ticket, tier);
  }

  private async toFile(ticket: TicketDetailDto, tier?: PassTier) {
    const buffer = await this.walletPass.generate(ticket, tier);
    return new StreamableFile(buffer, {
      type: PKPASS_MIME,
      disposition: `attachment; filename="${ticket.code}.pkpass"`,
      length: buffer.length,
    });
  }
}
