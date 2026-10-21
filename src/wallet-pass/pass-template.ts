import type { TicketDetailDto } from './dto/ticket-detail.dto.js';

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
type Values = Record<string, string | null | undefined>;

const PLACEHOLDER = /\{\{([^}]+)\}\}/g;
const VN_OFFSET_MINUTES = 7 * 60;

class MissingValue extends Error {}

/** ISO 8601 in +07:00, which Wallet needs to show the local event time. */
export function toLocalIso(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const local = new Date(date.getTime() + VN_OFFSET_MINUTES * 60_000);
  return `${local.toISOString().slice(0, 19)}+07:00`;
}

function join(parts: (string | null | undefined)[], sep: string) {
  return parts.filter(Boolean).join(sep) || null;
}

export function buildValues(ticket: TicketDetailDto): Values {
  return {
    'ticket.id': ticket.id,
    'ticket.sessionId': ticket.sessionId,
    'ticket.showTitle': ticket.showTitle,
    'ticket.sessionName': ticket.sessionName,
    'ticket.startsAt': toLocalIso(ticket.startsAt),
    'ticket.endsAt': toLocalIso(ticket.endsAt),
    'ticket.venueName': ticket.venueName,
    'ticket.ticketTypeName': ticket.ticketTypeName,
    'ticket.zoneName': ticket.zoneName,
    'ticket.seatRowLabel': ticket.seatRowLabel,
    'ticket.seatLabel': ticket.seatLabel,
    // Must match the QR shown in the app so gates can scan it.
    'ticket.qr.payload': ticket.qr.payload,
    'ticket.code': ticket.code,
    'ticket.orderId': ticket.orderId,
    'ticket.ticketTypeTerms': ticket.ticketTypeTerms,
    'ticket.termsLink': ticket.termsLink,
    seatDisplay: join([ticket.seatRowLabel, ticket.seatLabel], ''),
    addressText: join([ticket.addressLine, ticket.city], ', '),
    perksText: join(ticket.perks ?? [], '\n'),
    paymentText: join([ticket.paymentMethod, ticket.paymentRef], ' · '),
  };
}

/**
 * Replaces `{{...}}` placeholders. A key whose value is missing is dropped;
 * a missing `value`/`message` drops the whole field object instead.
 */
function fill(node: Json, values: Values): Json {
  if (typeof node === 'string') {
    const keys = [...node.matchAll(PLACEHOLDER)].map((m) => m[1].trim());
    if (!keys.length) return node;
    if (keys.some((k) => !values[k])) throw new MissingValue();
    return node.replace(PLACEHOLDER, (_, k: string) => values[k.trim()]!);
  }
  if (Array.isArray(node)) {
    const out: Json[] = [];
    for (const item of node) {
      try {
        out.push(fill(item, values));
      } catch (e) {
        if (!(e instanceof MissingValue)) throw e;
      }
    }
    return out;
  }
  if (node && typeof node === 'object') {
    const out: Record<string, Json> = {};
    for (const [key, item] of Object.entries(node)) {
      try {
        out[key] = fill(item, values);
      } catch (e) {
        if (!(e instanceof MissingValue)) throw e;
        if (key === 'value' || key === 'message') throw e;
      }
    }
    return out;
  }
  return node;
}

export function renderPassJson(
  template: Record<string, Json>,
  ticket: TicketDetailDto,
): Record<string, any> {
  const pass = fill(template, buildValues(ticket)) as Record<string, any>;

  pass.voided = ticket.status === 'voided' || ticket.qrState === 'cancelled';

  const eventTicket = pass.eventTicket ?? {};
  if (!eventTicket.headerFields?.length) delete eventTicket.headerFields;

  const seats: Record<string, string>[] | undefined = pass.semantics?.seats;
  if (seats && !seats.some((s) => Object.keys(s).length)) {
    delete pass.semantics.seats;
  }
  return pass;
}
