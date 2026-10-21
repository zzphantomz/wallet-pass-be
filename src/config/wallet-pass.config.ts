import { registerAs } from '@nestjs/config';

export const walletPassConfig = registerAs('walletPass', () => ({
  assetsDir: process.env.WALLET_PASS_ASSETS_DIR ?? 'assets/wallet-pass',
  signerCertPath: process.env.WALLET_PASS_SIGNER_CERT ?? 'certs/signerCert.pem',
  signerKeyPath: process.env.WALLET_PASS_SIGNER_KEY ?? 'certs/signerKey.pem',
  signerKeyPassphrase:
    process.env.WALLET_PASS_SIGNER_KEY_PASSPHRASE || undefined,
  wwdrPath: process.env.WALLET_PASS_WWDR ?? 'certs/wwdr.pem',
}));

export type WalletPassConfig = ReturnType<typeof walletPassConfig>;
