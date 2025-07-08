import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const supabase = createServerComponentClient({ cookies })
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has a token configured
    const { data, error } = await supabase
      .from('rd_station_configs')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking token:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ 
      hasToken: !!data,
      userId: user.id 
    })
  } catch (error) {
    console.error('Error in GET /api/rd-station/token:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies })
    const { token } = await request.json()

    if (!token || typeof token !== 'string' || !token.trim()) {
      return NextResponse.json(
        { error: 'Token é obrigatório' },
        { status: 400 }
      )
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate token format (basic validation)
    const trimmedToken = token.trim()
    if (trimmedToken.length < 10) {
      return NextResponse.json(
        { error: 'Token deve ter pelo menos 10 caracteres' },
        { status: 400 }
      )
    }

    // Save or update token in database
    const { data, error } = await supabase
      .from('rd_station_configs')
      .upsert({
        user_id: user.id,
        token: trimmedToken,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()

    if (error) {
      console.error('Error saving token:', error)
      return NextResponse.json(
        { error: 'Erro ao salvar token no banco de dados' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Token salvo com sucesso'
    })
  } catch (error) {
    console.error('Error in POST /api/rd-station/token:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const supabase = createServerComponentClient({ cookies })
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete token from database
    const { error } = await supabase
      .from('rd_station_configs')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting token:', error)
      return NextResponse.json(
        { error: 'Erro ao remover token' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Token removido com sucesso'
    })
  } catch (error) {
    console.error('Error in DELETE /api/rd-station/token:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}