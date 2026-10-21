# ticket-be

NestJS service ký và trả về Apple Wallet pass (`.pkpass`) cho vé sự kiện, dùng
[`passkit-generator`](https://github.com/alexandercerutti/passkit-generator).
Template port từ `fanos/docs/wallet-pass`.

```
assets/wallet-pass/
├── model/               # pass.json (placeholder {{...}}), icon, logo, vi/en pass.strings
├── tiers/<tier>/        # background*.png theo hạng FanPass (standard | prime | mythic)
└── sample-ticket.json   # TicketDetailDto mẫu
src/wallet-pass/
├── pass-template.ts     # điền placeholder, bỏ field null, đổi giờ sang +07:00, voided
├── wallet-pass.service.ts
└── wallet-pass.controller.ts
```

## Setup

```bash
pnpm install
cp .env.example .env
P12_PASSWORD=... ./scripts/convert-p12.sh path/to/passmaker.p12   # -> certs/*.pem
pnpm start:dev
```

`.p12` phải chứa cert Pass Type ID `pass.fanos.social.fandom.loyalty.pass` kèm private key.
Script tự tải Apple WWDR G4. Chưa có cert thì app vẫn chạy nhưng endpoint trả `503`.

## Deploy cert

Không commit `certs/*.pem` (đã gitignore). Trên server, set 3 secret env thay cho file:

```bash
./scripts/certs-to-env.sh   # in ra WALLET_PASS_{SIGNER_CERT,SIGNER_KEY,WWDR}_BASE64=...
```

Nếu có `*_BASE64` thì app dùng nó, nếu không thì đọc file theo `WALLET_PASS_SIGNER_CERT` / `_KEY` / `_WWDR`.

## API

| Method | Path | Body | Query |
| --- | --- | --- | --- |
| `POST` | `/v1/wallet-pass` | `TicketDetailDto` | `tier?=standard\|prime\|mythic` |
| `POST` | `/v1/wallet-pass/base64` | `TicketDetailDto` | `tier?` → JSON `{ fileName, pkpass }` cho `react-native-wallet-pass` |
| `GET` | `/v1/wallet-pass/sample` | – | `tier?` |

Trả về `application/vnd.apple.pkpass`.

- Không có `tier`: nền trắng, `imageHeroUrl` crop thành `strip.png` (375×98 pt).
- Có `tier`: nền theo hạng, chữ trắng, `imageHeroUrl` thành `thumbnail.png` (90×90 pt)
  (Apple không cho dùng strip chung với background).

```bash
curl -o ticket.pkpass "localhost:3000/v1/wallet-pass/sample?tier=prime"
curl -o ticket.pkpass -X POST localhost:3000/v1/wallet-pass?tier=mythic \
  -H 'content-type: application/json' -d @assets/wallet-pass/sample-ticket.json
```

Mở file `.pkpass` bằng Simulator / AirDrop sang iPhone để xem.

## Scripts

```bash
pnpm test        # unit (template)
pnpm test:e2e
pnpm build
```
