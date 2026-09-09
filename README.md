# Noor Tuition Center

Nursery se 8th class tak ke bachon ke tuition center ka management system.

## Features
- **Dashboard**: Kul taliba, classes, aaj ki haazri, fees ki statistics
- **Add Student**: Naya taliba register karna
- **Students**: Tamam taliba ki list, search aur class filter
- **Attendance**: Rozana haazri mark karna aur report dekhna
- **Fees**: Mahinay ki fees management (Ada Shuda / Baqi) — monthly collection report
- **Backup**: Download JSON / copy to clipboard / import from file — data transfer between devices
- **Offline PWA**: Works without internet; phone mein install karo (Add to Home Screen)

## Kaise Chalayen

Ye ek simple web app hai jo **bilkul free** hai aur **mobile** par kaam karta hai.

### Option 1: Direct Open (Laptop/Computer)
`index.html` file ko browser mein open karen. Sab data browser mein `localStorage` mein save hota hai.

### Option 2: Mobile par use karne ke liye (Online)

1. **GitHub (Free hosting)**:
   - GitHub account banayen (free)
   - Naya repository banayen
   - Ye tamam files upload karen
   - GitHub Pages enable karen (Settings > Pages > Deploy from branch > main)
   - Aap ko milega: `https://yourusername.github.io/reponame/`
   - Ye URL apne mobile par kholen

2. **Netlify / Vercel (Free)**:
   - Netlify par account banayen
   - Folder drag & drop karen
   - Free URL mil jayegi

3. **Google Drive + DriveToWeb**:
   - Folder Google Drive par upload karen
   - drv.tw se public URL banayen

### Mobile par "App" ki tarah (PWA)
Phone ke browser mein URL kholen, phir:
- **Android (Chrome)**: Menu (3 dots) > "Add to Home screen" / "Install app"
- **iPhone (Safari)**: Share button > "Add to Home Screen"

## Data Kahan Save Hota Hai?
- Saara data browser ke `localStorage` mein save hota hai
- Mobile par app delete karne par data bhi delete hoga
- Settings > Backup se data download/copy karke kisi bhi device par import kar sakte hain

## Project Structure
- `index.html` - Main page
- `style.css` - Styling (mobile-friendly responsive)
- `app.js` - Application logic
- `sw.js` - Service Worker (offline support)
- `manifest.json` - PWA settings
- `vendor/` - Bootstrap CSS/JS, Chart.js, SweetAlert2
