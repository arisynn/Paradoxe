import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const url = window.SUPABASE_URL || '';
const key = window.SUPABASE_ANON_KEY || '';

export const supabase = (url && key) ? createClient(url,key) : null;
