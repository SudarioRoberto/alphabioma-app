// lib/supabase.js
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dyrghugmacadhofvhglz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5cmdodWdtYWNhZGhvZnZoZ2x6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3Mzg4NjMsImV4cCI6MjA1OTMxNDg2M30.mT6wmOd4ZRu97z2ojMbD_J599OUWRi-ukSIYvPd0shM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});