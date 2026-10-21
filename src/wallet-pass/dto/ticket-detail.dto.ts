import { Type } from 'class-transformer';
import {
  IsArray,
  IsDefined,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class TicketQrDto {
  @IsString()
  @IsNotEmpty()
  payload: string;

  @IsOptional()
  @IsString()
  ticketId?: string;
}

/** Mirrors `TicketDetailDto` from `GET /v1/ticketing/me/tickets/:ticketId`. */
export class TicketDetailDto {
  @IsString()
  id: string;

  @IsString()
  code: string;

  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  orderId?: string | null;

  @IsString()
  sessionId: string;

  @IsOptional()
  @IsString()
  showId?: string | null;

  @IsString()
  showTitle: string;

  @IsOptional()
  @IsString()
  sessionName?: string | null;

  @IsISO8601()
  startsAt: string;

  @IsOptional()
  @IsISO8601()
  endsAt?: string | null;

  @IsOptional()
  @IsString()
  venueName?: string | null;

  @IsOptional()
  @IsString()
  addressLine?: string | null;

  @IsOptional()
  @IsString()
  city?: string | null;

  @IsOptional()
  @IsString()
  imageHeroUrl?: string | null;

  @IsOptional()
  @IsString()
  ticketTypeName?: string | null;

  @IsOptional()
  @IsString()
  zoneName?: string | null;

  @IsOptional()
  @IsString()
  seatRowLabel?: string | null;

  @IsOptional()
  @IsString()
  seatLabel?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  perks?: string[] | null;

  @IsOptional()
  @IsString()
  qrState?: string | null;

  @IsOptional()
  @IsString()
  termsLink?: string | null;

  @IsOptional()
  @IsString()
  ticketTypeTerms?: string | null;

  @IsOptional()
  @IsString()
  paymentRef?: string | null;

  @IsOptional()
  @IsString()
  paymentProvider?: string | null;

  @IsOptional()
  @IsString()
  paymentMethod?: string | null;

  /** Encoded as-is into the pass QR; must match what the gate scans. */
  @IsDefined()
  @ValidateNested()
  @Type(() => TicketQrDto)
  qr: TicketQrDto;
}
