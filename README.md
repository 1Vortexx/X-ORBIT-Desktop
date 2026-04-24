<div align="center">

<img src="https://codehs.com/uploads/ab65fa0acacaff18144310e79cb0895f" width="96" height="96" style="border-radius:50%" />

# X-ORBIT Desktop

**A full desktop operating system experience — running entirely in the browser.**

[![Release](https://img.shields.io/badge/release-5.5.7%20Ventas-7c3aed?style=flat-square)](https://github.com/1Vortexx/hammerspoon/releases)
[![Status](https://img.shields.io/badge/status-stable-22c55e?style=flat-square)](https://xorbit.org)
[![Built With](https://img.shields.io/badge/built%20with-HTML%20%2F%20CSS%20%2F%20JS-a855f7?style=flat-square)](#)
[![License](https://img.shields.io/badge/license-proprietary-475569?style=flat-square)](#)

[Live Demo](https://xorbit.org) · [Support Portal](https://xorbit.org/support) · [Changelogs](https://xorbit.org/changelogs)

<br/>

![X-ORBIT Promotional](https://raw.githubusercontent.com/1Vortexx/X-ORBIT-Desktop/main/assets/promotional.png)

</div>

---

## What is X-ORBIT?

X-ORBIT Desktop is a browser-based operating system built entirely in HTML, CSS, and JavaScript. It delivers a full windowed desktop environment — complete with a dock, menu bar, notification center, and native-feeling apps — from any modern web browser, with nothing to install.

X-ORBIT is a passion project pushing the boundaries of what the web can do.

---

## Features

### Desktop Environment
- **Windowed UI** — resizable, draggable windows with macOS-style title bar controls (close, minimize, maximize)
- **Dock** — app launcher with hover animations and active indicators
- **Menu Bar** — clock, notification badge, quick-access menus
- **Notification Center** — in-OS notification feed with filtering
- **Themes** — swappable theme stylesheets (Dark, Minimalist, Orange, and more)
- **PWA Support** — installable as a standalone desktop/mobile app via Web App Manifest

### Authentication
- **macOS Catalina-style login screen** — full-screen wallpaper, floating account circles, glassmorphism inputs
- **Remembered user** — saves the last logged-in account with avatar loading
- **Click-first interaction** — circles animate to center on click before showing the password field
- **Field state indicators** — inputs turn red/green with Font Awesome icons on failed/successful login
- **Inline account creation flow** — transforms the login screen to guide new users through the support portal signup process
- **Account warnings** — modal acknowledgement for flagged accounts before login completes
- Powered by **Supabase** for auth, login attempt logging, and live alert fetching

### Built-in Apps

| App | Description |
|-----|-------------|
| **Browser** | Full in-OS web browser with Ultraviolet and Rammerhead proxy support for unrestricted browsing |
| **Music** | Integrated music player linked to a proxies Spotify SDK thorugh Monochrome |
| **Minecraft** | Playable Minecraft via Eaglecraft 1.12 |
| **Jitter** | Built-in X-ORBIT messaging platform to DM your friends |
| **Changelog** | In-OS release notes viewer |
| **Support** | Help & support portal access |
| **Settings** | OS configuration and personalization |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Auth & Database | [Supabase](https://supabase.com) |
| Proxy | [Ultraviolet](https://github.com/titaniumnetwork-dev/Ultraviolet) + [Rammerhead](https://github.com/binary-person/rammerhead) |
| Icons | [Font Awesome 6](https://fontawesome.com) |
| Fonts | [Inter](https://fonts.google.com/specimen/Inter) (Google Fonts) |
| PWA | Web App Manifest + Service Worker |
| Hosting | Custom domain via CNAME () |

---

## Getting Started

X-ORBIT is account-gated. To get access:

1. Visit the [Support Portal](https://xorbit.org/support)
2. Register for an Account Services account
3. Submit a ticket requesting X-ORBIT access
4. Receive your login credentials via email

Once you have credentials, log in at [xorbit.org](https://xorbit.org).

---

## Releases

| Version | Codename | Status | Date |
|---------|----------|--------|------|
| 5.1.0 | Nova | ✅ Stable | Apr 2026 |
| 5.0.1B | Ventas | 🧪 Beta | Feb 2026 |
| 4.6.1 | Astra | ✅ Stable | Feb 2026 |

Full release notes: [GitHub Releases](https://github.com/1Vortexx/hammerspoon/releases)

---

## Project Structure

```
xorbit-main/
├── index.html              # Main desktop OS shell
├── auth.html               # Login screen
├── browser.html            # In-OS web browser
├── terminal.html           # Terminal emulator
├── notification-center.html
├── changelogs.html
├── spotify-player.html     # Music app
├── X-MUSIC.html
├── studios.html
├── support.html
├── account.html
├── admin/                  # Admin dashboard
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── theme-minimalist.css
├── theme-orange.css
└── ...
```

---

## Credits

<table>
  <tr>
    <td align="center">
      <strong>Demitri Burns</strong><br/>
      <sub>Founder · Lead Developer · Designer</sub><br/>
      <sub>Every line of code. Every pixel.</sub>
    </td>
  </tr>
</table>

---

<div align="center">

**X-ORBIT** — All systems operational.

[xorbit.org](https://xorbit.org) · [Support](https://xorbit.org/support) · [Terms](https://xorbit.org/tos) · [Privacy](https://xorbit.org/privacy)

</div>
