import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseURL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseURL || !supabaseKEY) {
    throw new Error('missing Supabase environment variables');
}

const supabase = createClient (
    supabaseURL,
    supabaseKEY
);

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('studentId');

        if (!studentId) {
            return NextResponse.json(
                { error: 'Student ID is required' },
                { status: 400 }
            );
        }
        
        const { data: student, error } = await supabase
        .from('Students')
        .select(`
            id,
            email,
            progress,
            status:isActive,
            first_name,
            last_name,
            avatar,
            current_level,
            grade_reading,
            grade_math,
            learning_style,
            plan,
            timeSpent,
            isActive,
            lastActive,
            created_at 
        `)
        .eq('id', studentId)
        .single();

        // 056e6ece-2416-4be1-88aa-aa1d26faf8b1

        // Checks for database errors 
        if (error) {
            console.error(error);
            return NextResponse.json(
                { error: "Failed to fetch students" },
                { status: 500}
            );
        }

        // Checks if student is not found 
        if (!student) {
            return NextResponse.json(
                { error: 'Student not found' },
                { status: 404 }
            );
        }

        // Format response with name as first_name
        const formattedStudent = {
            ...student,
            name: student.first_name || null
        };

        return NextResponse.json({ student: formattedStudent });
    }
    
    catch (error) {
    console.error('Error fetching student data:', error);
    return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
        );
    }
}