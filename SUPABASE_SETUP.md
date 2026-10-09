# Supabase setup untuk Pastel Paradox

## 1. Buat tabel

Buka Supabase SQL Editor, tempel seluruh isi `supabase/schema.sql`, lalu jalankan.
SQL tersebut aman dijalankan ulang karena kolom tambahan memakai `if not exists`.

## 2. Pasang environment variable di Vercel

Tambahkan:

```env
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

`SUPABASE_SERVICE_ROLE_KEY` hanya untuk function di folder `api/`. Jangan pernah
menaruhnya di `index.html` atau membagikannya ke pemain.

## 3. Perilaku hint versi baru

- Pemain baru mulai dengan 3 Hint.
- Tombol Hint menampilkan saldo yang tersedia.
- Satu tekan memakai 1 Hint dan menampilkan arah swipe berikutnya selama sekitar 2,6 detik.
- Setelah 3 kali kalah pada level yang sama, pemain mendapat 1 Hint tambahan, maksimal 5.
- Memakai Hint tetap membuat hasil level mendapat maksimal 1 bintang, seperti aturan sebelumnya.

## 4. Endpoint yang dipakai game

- `GET /api/leaderboard` membaca Top 10 dari tabel `players`.
- `POST /api/submit-score` memperbarui ringkasan pemain di `players` dan mencatat snapshot di `scores`.

Redis/Upstash tidak lagi diperlukan untuk versi ini.
