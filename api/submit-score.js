
import { createClient } from '@supabase/supabase-js';

// Gunakan service-role key hanya di server/Vercel, jangan ditaruh di index.html.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    if (!supabase) {
        return res.status(500).json({ error: 'Supabase belum dikonfigurasi.' });
    }

    const { playerId, name, level, steps, stars, hintsUsed, hintBalance, pin } = req.body;

    // Validasi payload dasar
    if (!playerId || !name || !pin) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const { data: existingUser, error: lookupError } = await supabase
            .from('players')
            .select('player_uid, pin, level')
            .eq('player_uid', String(playerId))
            .maybeSingle();

        if (lookupError) throw lookupError;

        // Jika user sudah ada tapi PIN yang dikirim salah
        if (existingUser && existingUser.pin && existingUser.pin !== String(pin)) {
            return res.status(401).json({ error: 'PIN salah / Nama sudah dipakai orang lain.' });
        }

        // Anti-Cheat Ringan: Tolak kalau loncat level berlebihan dibanding rekam jejaknya
        if (existingUser && existingUser.level) {
            const oldLevel = Number(existingUser.level);
            if (Number(level) > oldLevel + 2) {
                return res.status(400).json({ error: 'Aktivitas mencurigakan (Level lompat tak wajar)' });
            }
        }

        const safePlayer = {
            player_uid: String(playerId),
            username: String(name).substring(0, 15),
            pin: String(pin),
            level: Number(level) || 1,
            total_stars: Number(stars) || 0,
            total_steps: Number(steps) || 0,
            total_hints: Number(hintsUsed) || 0,
            updated_at: new Date().toISOString()
        };
        if (Number.isFinite(Number(hintBalance))) {
            safePlayer.hint_balance = Math.max(0, Math.min(5, Number(hintBalance)));
        }

        const { data: savedPlayer, error: saveError } = await supabase
            .from('players')
            .upsert(safePlayer, { onConflict: 'player_uid' })
            .select('player_uid, hint_balance')
            .single();

        if (saveError) throw saveError;

        const { error: scoreError } = await supabase.from('scores').insert({
            player_uid: String(playerId),
            score: Number(stars) || 0,
            time_used: 0,
            hints_used: Number(hintsUsed) || 0
        });

        if (scoreError) throw scoreError;

        return res.status(200).json({ success: true, hintBalance: savedPlayer?.hint_balance ?? 3 });
        
    } catch (error) {
        console.error("Supabase score error:", error);
        return res.status(500).json({ error: 'Terjadi kesalahan internal pada server' });
    }
}

