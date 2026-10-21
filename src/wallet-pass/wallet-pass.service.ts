import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import {
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PKPass } from 'passkit-generator';
import sharp from 'sharp';
import {
  type CertSource,
  walletPassConfig,
} from '../config/wallet-pass.config.js';
import type { TicketDetailDto } from './dto/ticket-detail.dto.js';
import { renderPassJson } from './pass-template.js';
import { PassTier, TIER_COLORS } from './pass-tier.js';

type Buffers = Record<string, Buffer>;

/** Point sizes; each image is also rendered at @2x and @3x. */
const STRIP_SIZE = { width: 375, height: 98 };
const THUMBNAIL_SIZE = { width: 90, height: 90 };
const SCALES = [1, 2, 3] as const;
const HERO_FETCH_TIMEOUT_MS = 5_000;

@Injectable()
export class WalletPassService implements OnModuleInit {
  private readonly logger = new Logger(WalletPassService.name);
  private modelFiles: Buffers = {};
  private template: Record<string, any> = {};
  private tierBackgrounds = {} as Record<PassTier, Buffers>;
  private certificates?: ConstructorParameters<typeof PKPass>[1];

  constructor(
    @Inject(walletPassConfig.KEY)
    private readonly config: ConfigType<typeof walletPassConfig>,
  ) {}

  async onModuleInit() {
    const modelDir = path.resolve(this.config.assetsDir, 'model');
    this.modelFiles = await readDirBuffers(modelDir);
    this.template = JSON.parse(this.modelFiles['pass.json'].toString('utf8'));
    delete this.modelFiles['pass.json'];

    for (const tier of Object.values(PassTier)) {
      const dir = path.resolve(this.config.assetsDir, 'tiers', tier);
      this.tierBackgrounds[tier] = await readDirBuffers(dir);
    }

    this.certificates = await this.loadCertificates();
  }

  async generate(ticket: TicketDetailDto, tier?: PassTier): Promise<Buffer> {
    if (!this.certificates) {
      throw new ServiceUnavailableException(
        'Wallet pass signing certificates are not configured',
      );
    }

    const pass = renderPassJson(this.template, ticket);

    const hero = await this.fetchHero(ticket.imageHeroUrl);
    const buffers: Buffers = { ...this.modelFiles };

    // Apple does not allow a strip together with a background, so a tier
    // pass shows the hero as a thumbnail instead.
    if (tier) {
      Object.assign(pass, TIER_COLORS[tier]);
      Object.assign(buffers, this.tierBackgrounds[tier]);
      if (hero)
        Object.assign(buffers, await resize(hero, 'thumbnail', THUMBNAIL_SIZE));
    } else if (hero) {
      Object.assign(buffers, await resize(hero, 'strip', STRIP_SIZE));
    }

    buffers['pass.json'] = Buffer.from(JSON.stringify(pass));
    return new PKPass(buffers, this.certificates).getAsBuffer();
  }

  private async loadCertificates() {
    const { certificates, signerKeyPassphrase } = this.config;
    try {
      const [signerCert, signerKey, wwdr] = await Promise.all(
        [
          certificates.signerCert,
          certificates.signerKey,
          certificates.wwdr,
        ].map(readCert),
      );
      return { signerCert, signerKey, wwdr, signerKeyPassphrase };
    } catch (error) {
      this.logger.warn(
        `Signing certificates not loaded, wallet passes are disabled: ${(error as Error).message}`,
      );
      return undefined;
    }
  }

  private async fetchHero(url?: string | null): Promise<Buffer | undefined> {
    if (!url) return undefined;
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(HERO_FETCH_TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (error) {
      this.logger.warn(`Skip hero image ${url}: ${(error as Error).message}`);
      return undefined;
    }
  }
}

async function readCert(source: CertSource): Promise<Buffer> {
  if (source.base64) return Buffer.from(source.base64, 'base64');
  return readFile(path.resolve(source.path));
}

async function readDirBuffers(root: string): Promise<Buffers> {
  const entries = await readdir(root, { recursive: true, withFileTypes: true });
  const files = entries.filter((e) => e.isFile() && !e.name.startsWith('.'));
  const buffers: Buffers = {};
  for (const file of files) {
    const fullPath = path.join(file.parentPath, file.name);
    const rel = path.relative(root, fullPath).split(path.sep).join('/');
    buffers[rel] = await readFile(fullPath);
  }
  return buffers;
}

async function resize(
  image: Buffer,
  name: string,
  size: { width: number; height: number },
): Promise<Buffers> {
  const out: Buffers = {};
  for (const scale of SCALES) {
    const suffix = scale === 1 ? '' : `@${scale}x`;
    out[`${name}${suffix}.png`] = await sharp(image)
      .resize(size.width * scale, size.height * scale, { fit: 'cover' })
      .png()
      .toBuffer();
  }
  return out;
}
