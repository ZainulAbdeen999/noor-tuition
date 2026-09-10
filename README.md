# Noor — Tuition Center Manager

A fully offline tuition center management app for centers teaching Nursery to 8th standard. Works on mobile and desktop. All data stays on your device.

## Features
- **Dashboard**: Total students, classes, today's attendance, and fee collection statistics
- **Add Student**: Register a new student
- **Students**: Full student list with search and class filter
- **Attendance**: Mark daily attendance and view reports
- **Fees**: Monthly fee management (Paid / Due) with collection reports
- **Backup**: Download JSON / copy to clipboard / import from file — move data between devices
- **Offline PWA**: Works without internet; install it on your phone like a native app

## How to Run

The app is entirely free and works on mobile and computer.

### Option 1: Open Directly (Laptop/Computer)
Open the `index.html` file in any browser. All data is saved in the browser's `localStorage`.

### Option 2: Use on Mobile (Online)
Host the files on any free static host and open the URL on your phone:
1. **GitHub Pages** — create a free GitHub account, upload these files to a repository, enable Pages (Settings > Pages > Deploy from branch > main), then open `https://yourusername.github.io/reponame/`
2. **Netlify / Vercel** — create an account and upload the folder to get a free URL
3. **Google Drive + DriveToWeb** — upload the folder and generate a public URL with drv.tw

### Install as an App (PWA)
Open the URL in your phone's browser, then:
- **Android (Chrome)**: Menu (3 dots) > "Install app"
- **iPhone (Safari)**: Share button > "Add to Home Screen"

## Where Is Data Stored?
- All data is saved in the browser's `localStorage`
- Deleting the app from your phone also deletes its data
- Use Settings > Backup to download/copy data and import it on any other device

## Project Structure
- `index.html` - Main page
- `style.css` - Styling (mobile-friendly responsive)
- `app.js` - Application logic
- `sw.js` - Service Worker (offline support)
- `manifest.json` - PWA settings
- `vendor/` - Bootstrap CSS/JS, Chart.js, SweetAlert2