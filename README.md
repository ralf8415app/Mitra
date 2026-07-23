# Color Traffic Puzzle V3

Browser- und PWA-Spiel für GitHub Pages.

## Funktionen

- 150 Level
- automatische lokale Speicherung
- Level-Freischaltung
- Sterne-System
- Rückgängig-Funktion
- Hinweis-Funktion
- Ton an/aus
- offline spielbar
- für iPhone, iPad, Android, Windows und Desktop-Browser
- PWA-Installation über den Browser

## GitHub Pages veröffentlichen

1. Auf GitHub ein neues Repository anlegen.
2. Alle Dateien aus diesem Ordner direkt in das Repository hochladen.
3. In GitHub **Settings → Pages** öffnen.
4. Unter **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/(root)**
5. Speichern.
6. Nach kurzer Zeit ist das Spiel unter der GitHub-Pages-Adresse erreichbar.

## Lokal testen

Wegen des Service Workers sollte das Projekt über einen lokalen Webserver gestartet werden.

Mit Python:

```bash
python -m http.server 8080
```

Dann im Browser öffnen:

```text
http://localhost:8080
```

## Steuerung

- Auto antippen: Auto fährt in Pfeilrichtung
- **Rückgängig**: letzten Zug zurücknehmen
- **Hinweis**: freies Auto markieren
- **Neustart**: aktuelles Level neu beginnen
- Tastatur:
  - `R`: Neustart
  - `H`: Hinweis
  - `Strg/Cmd + Z`: Rückgängig

## Technik

- HTML5
- CSS3
- Vanilla JavaScript
- LocalStorage
- Service Worker
- Web App Manifest

## Lizenz

MIT
