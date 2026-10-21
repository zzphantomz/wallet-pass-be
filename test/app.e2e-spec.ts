import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';

describe('WalletPassController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // No certificates: signing is disabled but the app still boots.
    process.env.WALLET_PASS_SIGNER_CERT = 'certs/__missing__.pem';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  it('rejects an invalid ticket', () => {
    return request(app.getHttpServer())
      .post('/v1/wallet-pass')
      .send({})
      .expect(400);
  });

  it('rejects a ticket without a QR payload', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/wallet-pass/base64')
      .send({
        id: 't1',
        code: 'C1',
        status: 'issued',
        sessionId: 's1',
        showTitle: 'Show',
        startsAt: '2026-12-20T12:30:00.000Z',
        qr: { payload: '' },
      })
      .expect(400);
    expect(res.body.message).toContain('qr.payload should not be empty');
  });

  it('rejects an unknown tier', () => {
    return request(app.getHttpServer())
      .get('/v1/wallet-pass/sample?tier=gold')
      .expect(400);
  });

  it('returns 503 when certificates are missing', () => {
    return request(app.getHttpServer())
      .get('/v1/wallet-pass/sample')
      .expect(503);
  });

  afterAll(async () => {
    await app.close();
  });
});
