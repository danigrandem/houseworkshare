import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase.auth.getSession()

        return NextResponse.json({
            success: true,
            hasSession: !!data.session,
            error: error?.message || null,
            message: 'Conexión a Supabase exitosa',
        })
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                message: 'Error al conectar con Supabase',
            },
            { status: 500 }
        )
    }
}
