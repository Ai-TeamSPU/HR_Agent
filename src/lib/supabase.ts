import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kvvbkiasrnppxvopezin.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dmJraWFzcm5wcHh2b3BlemluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwMzUyMzUsImV4cCI6MjEwMjYxMTIzNX0.diRg2xFBByrko9jrVi1MemtEZhHeAFqhNKbw89KHqT4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
