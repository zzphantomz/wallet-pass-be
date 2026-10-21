import { registerAs } from '@nestjs/config';

export const walletPassConfig = registerAs('walletPass', () => ({
  assetsDir: process.env.WALLET_PASS_ASSETS_DIR ?? 'assets/wallet-pass',
  signerKeyPassphrase:
    process.env.WALLET_PASS_SIGNER_KEY_PASSPHRASE || undefined,
  // Each cert comes from *_BASE64 (PEM content, for deploys) or a PEM file.
  certificates: {
    signerCert: certSource('WALLET_PASS_SIGNER_CERT', 'certs/signerCert.pem'),
    signerKey: certSource('WALLET_PASS_SIGNER_KEY', 'certs/signerKey.pem'),
    wwdr: certSource('WALLET_PASS_WWDR', 'certs/wwdr.pem'),
  },
}));

export type CertSource = { base64?: string; path: string };

function certSource(envName: string, defaultPath: string): CertSource {
  return {
    base64: process.env[`${envName}_BASE64`] || undefined,
    path: process.env[envName] || defaultPath,
  };
}

export type WalletPassConfig = ReturnType<typeof walletPassConfig>;
