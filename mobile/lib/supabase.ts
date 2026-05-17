import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uszdiqdlwempkjqjlvaq.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzemRpcWRsd2VtcGtqcWpsdmFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NTc4MDksImV4cCI6MjA3ODUzMzgwOX0.TT4TfWVVtwRQgPRCwjf1qvXSVsWBtbkdWuXhpmtHNTM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
