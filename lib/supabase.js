// lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dyrghugmacadhofvhglz.supabase.co'; // seu URL do Supabase
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5cmdodWdtYWNhZGhvZnZoZ2x6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3Mzg4NjMsImV4cCI6MjA1OTMxNDg2M30.mT6wmOd4ZRu97z2ojMbD_J599OUWRi-ukSIYvPd0shM'; // pegue essa chave no Supabase > Project > Settings > API > anon key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
