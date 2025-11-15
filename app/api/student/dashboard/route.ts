import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseURL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!supabaseURL || !supabaseKEY) {
    throw new Error('missing supabase enviornment variables')
}

const supbase = createClient (
    supabaseURL,
    supabaseKEY
);

export async function GET (request: Request) {
    try {
        const { data: students, error } = await supbase
    }
}