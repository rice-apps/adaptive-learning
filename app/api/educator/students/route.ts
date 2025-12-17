import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseURL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseURL || !supabaseKEY) {
  throw new Error('missing supabase environment variables')
}

const supabase = createClient(
    supabaseURL,
    supabaseKEY
);

export async function GET (request: Request){
    try {
        const { data: students, error } = await supabase
        .from('Students')
        .select(`
            id,
            email,
            progress,
            status:isActive,
            profileName,
            avatar
        `)
        .order('created_at', { ascending: false })

        if (error) {
            console.error(error);
        return NextResponse.json(
            { error: 'something went wrong :(' },
            {status: 500}
        ) 
        }

        return NextResponse.json({
            students: students,
            total: students?.length || 0
        })
    }

    catch (error) {
        return NextResponse.json(
            { error: 'failed to get students' },
            {status: 500}
        )
    }
}

