import { readFileSync } from 'node:fs';
import { TicketDetailDto } from './dto/ticket-detail.dto.js';
import { renderPassJson, toLocalIso } from './pass-template.js';

const template = JSON.parse(
  readFileSync('assets/wallet-pass/model/pass.json', 'utf8'),
);
const sample = JSON.parse(
  readFileSync('assets/wallet-pass/sample-ticket.json', 'utf8'),
) as TicketDetailDto;

describe('renderPassJson', () => {
  it('fills placeholders from the ticket', () => {
    const pass = renderPassJson(template, sample);

    expect(pass.serialNumber).toBe(sample.id);
    expect(pass.relevantDate).toBe('2026-10-23T09:11:00+07:00');
    expect(pass.barcodes[0].message).toBe(sample.qr!.payload);
    expect(pass.eventTicket.headerFields[0].value).toBe('A10');
    expect(pass.voided).toBe(false);
    expect(JSON.stringify(pass)).not.toContain('{{');
  });

  it('drops fields whose values are missing', () => {
    const pass = renderPassJson(template, {
      ...sample,
      endsAt: null,
      seatRowLabel: null,
      seatLabel: null,
      termsLink: null,
      ticketTypeTerms: null,
    });

    expect(pass.expirationDate).toBeUndefined();
    expect(pass.semantics.eventEndDate).toBeUndefined();
    expect(pass.eventTicket.headerFields).toBeUndefined();
    const backKeys = pass.eventTicket.backFields.map((f: any) => f.key);
    expect(backKeys).not.toContain('terms');
  });

  it('keeps terms without the link when termsLink is null', () => {
    const pass = renderPassJson(template, sample);
    const terms = pass.eventTicket.backFields.find(
      (f: any) => f.key === 'terms',
    );

    expect(terms.value).toBe(sample.ticketTypeTerms);
    expect(terms.attributedValue).toBeUndefined();
  });

  it('voids cancelled tickets', () => {
    expect(
      renderPassJson(template, { ...sample, status: 'voided' }).voided,
    ).toBe(true);
    expect(
      renderPassJson(template, { ...sample, qrState: 'cancelled' }).voided,
    ).toBe(true);
  });
});

describe('toLocalIso', () => {
  it('converts to +07:00', () => {
    expect(toLocalIso('2026-12-20T12:30:00.000Z')).toBe(
      '2026-12-20T19:30:00+07:00',
    );
    expect(toLocalIso(null)).toBeNull();
  });
});
