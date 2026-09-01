# Ultraviolet Proxy — Deployment & Reference

## What It Is

Web proxy service for X-ORBIT, powered by [Ultraviolet](https://github.com/titaniumnetwork-dev/Ultraviolet) (Titanium Network).
Live at: **https://uv.xorbit.org**

Features:
- URL/search proxying via Ultraviolet service worker architecture
- Wisp WebSocket transport (via `@mercuryworkshop/wisp-js`)
- Epoxy transport layer for enhanced connectivity
- Built-in NSFW/gore domain blocklist with XOR-encoded URL inspection
- Custom X-ORBIT browser frontend with tabs, navigation controls, and settings

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (>= 16) |
| Server | Fastify 5 with custom HTTP server factory |
| Proxy core | `@titaniumnetwork-dev/ultraviolet` ^3.2.10 |
| Transport | `@mercuryworkshop/epoxy-transport` ^2.1.25, `@mercuryworkshop/bare-mux` ^2.1.8 |
| WebSocket | `wisp-server-node` ^1.1.7, `@mercuryworkshop/wisp-js` ^0.4.1, `ws` ^8.18.0 |
| Legacy compat | `@tomphttp/bare-server-node` ^2.0.6 |
| Static files | `ultraviolet-static` (from GitHub), `@fastify/static` ^8.0.2 |
| Frontend | Vanilla HTML/CSS/JS (custom X-ORBIT browser UI) |
| Process manager | PM2 (name: `ultraviolet`, id: 0) |

---

## Project Structure

```
/root/Ultraviolet-App/
├── src/
│   └── index.js              # Main server — Fastify, Wisp upgrade, content filter, static routes
│
├── public/
│   ├── index.html             # X-ORBIT browser UI (landing page served by UV)
│   ├── script.js              # Browser logic — tab management, SW registration, URL processing
│   ├── styles.css             # Glass-morphism dark theme styles
│   └── uv/                    # Ultraviolet client-side assets (auto-generated)
│       ├── uv.config.js       # UV config (prefix, encoding, service worker path)
│       ├── uv.bundle.js       # UV client bundle
│       └── uv.sw.js           # UV service worker
│
├── package.json               # Dependencies and scripts
├── docker-compose.yml         # Docker setup (not used in production)
├── Dockerfile                 # Docker image definition
├── vercel.json                # Vercel config (not used in production)
└── README.md
```

---

## How It Works

### Proxy Architecture

1. **Service Worker** — The browser registers `/sw.js` scoped to UV's prefix (`/uv/service/`). All requests under that prefix are intercepted by the service worker.

2. **URL Encoding** — URLs are XOR-encoded (each character XOR'd with `2`) before being passed to the proxy path. Example: `https://google.com` becomes `/uv/service/<xor-encoded-string>`.

3. **Wisp Transport** — WebSocket connections upgrade to the Wisp protocol at the `/wisp/` endpoint, providing the actual proxy tunnel for network requests.

4. **Epoxy Transport** — `@mercuryworkshop/epoxy-transport` provides an alternative transport layer via `bare-mux` for enhanced reliability.

5. **Request Flow**:
   ```
   User enters URL → script.js encodes via __uv$config.encodeUrl()
   → iframe loads /uv/service/<encoded> → service worker intercepts
   → bare-mux routes through Wisp WebSocket → remote site fetched
   → response returned through proxy pipeline → rendered in iframe
   ```

### Content Filter

The server inspects incoming requests to `/uv/service/*`, XOR-decodes the URL, and checks the hostname against a hardcoded blocklist of adult/gore domains. Blocked requests return a `403` with a styled "Blocked" page. DNS-level filtering (Cloudflare `1.1.1.3`) provides an additional layer.

### Static File Serving

Fastify serves multiple static directories:
- `/` — `ultraviolet-static` public path (UV assets)
- `/uv/` — Ultraviolet core library files
- `/epoxy/` — Epoxy transport files
- `/baremux/` — Bare-mux transport files

---

## Hosting

| Detail | Value |
|---|---|
| VPS IP | `158.173.1.138` |
| SSH | `ssh root@158.173.1.138` (key: `~/.ssh/id_ed25519`) |
| Server path | `/root/Ultraviolet-App/` |
| Process manager | PM2 — process name `ultraviolet` (id 0) |
| Domain | `uv.xorbit.org` |
| Port | `8080` (internal) |
| SSL | Certbot via nginx (expires 2026-11-30, auto-renews) |

---

## Nginx Config

Located at `/etc/nginx/sites-available/ultraviolet`, symlinked to `sites-enabled`.

```nginx
server {
    listen 80;
    server_name uv.xorbit.org;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name uv.xorbit.org;

    ssl_certificate /etc/letsencrypt/live/uv.xorbit.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/uv.xorbit.org/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Key: `Connection 'upgrade'` and `Upgrade $http_upgrade` headers are required for Wisp WebSocket transport.

---

## Managing the Server

```bash
# Restart
pm2 restart ultraviolet

# View logs
pm2 logs ultraviolet

# Stop
pm2 stop ultraviolet

# Check status
pm2 show ultraviolet
```

---

## X-ORBIT Browser Frontend

The xorbit-main site (`browser.html`) embeds the UV proxy in an iframe. The proxy backend URL is configured in `browser.html`:

```js
orbix: "https://uv.xorbit.org"
```

The browser UI provides:
- URL bar with search fallback (Google by default)
- Tab management (create, close, switch)
- Navigation controls (back, forward, refresh, home)
- Loading indicator
- Service worker registration scoped to UV prefix

---

## Domain History

| Date | Domain |
|---|---|
| Previous | `browse.itsvortexx.space` |
| Previous | `browse.xorbit.org` |
| Current | `uv.xorbit.org` |
