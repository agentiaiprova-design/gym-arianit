# GYM App — Arianit Ajdini

## Info
- **Atleta**: Arianit Ajdini
- **Trainer**: Luigi Cappucci
- **Programma**: Ipertrofia, 4 allenamenti/settimana (A/B/C/D)
- **Metodo**: Mantieni Ripetizioni — cedimento tecnico, rapporto 1:3 concentrica:eccentrica
- **Periodo scheda**: 06/04/26 – 04/05/26 (4 settimane, ma il programma è a cicli)

## Deploy
- **GitHub**: https://github.com/agentiaiprova-design/gym-arianit
- **Vercel**: (link generato da Vercel al deploy — aggiornare qui)
- Vercel si aggiorna automaticamente ad ogni `git push`

**Per aggiornare**: modificare i file in `D:\AI_Agency\ProgettiPerMe\GYM_Arianit\`, poi:
```
git add .
git commit -m "descrizione"
git push
```

**PWA**: aprire il link Vercel su Chrome (Android) o Safari (iPhone) → installa sulla schermata Home.

---

## File

| File | Ruolo |
|------|-------|
| `index.html` | Shell HTML |
| `data.js` | Definizione workout + storico fondamentali |
| `app.js` | SPA logic (routing, render, timer, beep, grafici) |
| `style.css` | Dark theme (identico all'app di Samuele) |
| `sw.js` | Service worker offline (cache: gym-arianit-v1) |
| `manifest.json` | PWA manifest |
| `icon.svg` | Icona app (lettera A verde) |

---

## Workout

### A — Petto + Bicipiti + Core
| # | Esercizio | Serie×Reps | Recupero | Note |
|---|-----------|-----------|---------|------|
| 1 | Bench Press | 4×3 | 2' | 1RM: 110kg |
| 2 | Dumbbell Bench Press | 5×5-6RM | 1' | Sett.2: 33kg |
| 3 | Pec Deck | 4×5-6RM | 1' | Sett.2: 71kg |
| 4 | Incline Seated Db Curl | 4×5-6RM | 1' | Sett.2: 16kg |
| 5 | Barbell Curl | 4×5-6RM | 1' | — |
| 6 | V-sit | 4×5-6RM | 1' | — |
| 7 | BOSU Crunch | 4×5-6RM | 1' | — |

### B — Schiena + Tricipiti + Femorali
| # | Esercizio | Serie×Reps | Recupero | Note |
|---|-----------|-----------|---------|------|
| 1 | Stacco da Terra | 4×3 | 2' | 1RM: 170kg |
| 2 | Pull up | 4×5-6RM | 1' | Sett.2: 10kg zavorra |
| 3 | Pulley | 4×5-6RM | 1' | Sett.2: 58kg |
| 4 | Straight Arm Pulldown | 4×5-6RM | 1' | — |
| 5 | Pushdown | 4×5-6RM | 1' | Sett.2: 60kg |
| 6 | Seated Db French Press | 4×5-6RM | 1' | — |
| 7 | Lying Leg Curl | 6×5-6RM | 1' | — |

### C — Gambe + Bicipiti + Polpacci
| # | Esercizio | Serie×Reps | Recupero | Note |
|---|-----------|-----------|---------|------|
| 1 | Back Squat | 4×3 | 2' | 1RM: 165kg |
| 2 | Leg Extension | 4×5-6RM | 1' | — |
| 3 | Db Backward Lunge | 4×5-6RM | 1' | — |
| 4 | Abductor Machine | 4×5-6RM | 1' | — |
| 5 | Incline Seated Db Curl | 5×5-6RM | 1' | Sett.2: 16kg |
| 6 | Leg Press Calf Raise | 6×5-6RM | 1' | — |

### D — Spalle + Dorsali + Tricipiti + Core
| # | Esercizio | Serie×Reps | Recupero | Note |
|---|-----------|-----------|---------|------|
| 1 | Seated Db Shoulder Press | 4×5-6RM | 1' | — |
| 2 | Cable Lateral Raise | 4×5-6RM | 1' | — |
| 3 | Up-Right Row | 3×5-6RM | 1' | — |
| 4 | Pull up | 4×5-6RM | 1' | Sett.2: 10kg zavorra |
| 5 | Straight Arm Pulldown | 4×5-6RM | 1' | — |
| 6 | Pushdown | 5×5-6RM | 1' | Sett.2: 60kg |
| 7 | Russian Twist | 5×5-6RM | 1' | — |

---

## 1RM noti
| Esercizio | 1RM | Storico inserito |
|-----------|-----|-----------------|
| Bench Press | 110kg | 4×3@95kg (07/04) |
| Back Squat | 165kg | 4×3@140kg (09/04) |
| Stacco da Terra | 170kg | 4×3@140kg (08/04) |

Nota: lo Stacco non era esplicitamente in nessun workout del PDF — inserito in Workout B (giornata schiena) come fondamentale.

---

## Differenze rispetto all'app di Samuele

| Aspetto | Samuele | Arianit |
|---------|---------|---------|
| Workout | A/B/C | A/B/C/D |
| Periodizzazione | 6 settimane con % e reps variabili | Nessuna — pesi liberi |
| Rep target | 8-10 reps | 5-6RM a cedimento |
| Recupero fondamentali | 2'30" | 2' |
| Recupero altri | 60"-90" | 60" |
| Timer | vibrazione | vibrazione + doppio beep audio |
| Storico | 10 sessioni (MacroFactor) | 3 sessioni (solo fondamentali) |

---

## Architettura app.js

- `STORAGE_KEY = 'gym_sessions_arianit_v1'` (localStorage separato da Samuele)
- Nessun `getCurrentWeek()` né `PERIODIZATION`
- `getTarget(ex)` senza parametro week — usa direttamente `ex.sets`, `ex.reps`, `ex.rest`
- `playBeep()` — doppio bip via Web Audio API alla fine del recupero
- Grafici 1RM stimato (Epley) per Bench Press, Squat, Stacco
- `saveWorkout(workout)` senza parametro week

---

## Come continuare in una nuova sessione Claude

1. Leggi questo file (`ARIANIT_PROJECT.md`)
2. Leggi `app.js` e `data.js` per stato aggiornato
3. Per modifiche: edita i file, poi `git push` dalla cartella `GYM_Arianit`

### Possibili sviluppi futuri
- Aggiungere storico completo settimane 2-4 quando Arianit li fornisce
- Aggiornare link Vercel qui sopra
- Bump cache SW: `gym-arianit-v1` → `v2` ad ogni aggiornamento forzato
