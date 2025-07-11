    // supabase/functions/token-enricher/index.ts
    import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
    import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

    console.log('Token Enricher function initializing...');

    serve(async (req) => {
    try {
        const { user } = await req.json();

        if (!user) {
        throw new Error('User data not provided in the request body.');
        }

        // Criar um cliente Supabase com privilégios de administrador para
        // poder consultar a tabela 'profiles' de dentro da função.
        // As variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
        // são injetadas automaticamente no ambiente das Edge Functions.
        const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Buscar o company_id na tabela de perfis
        const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

        if (error) {
        console.error('Error fetching profile:', error);
        throw new Error(`Failed to fetch profile for user ${user.id}`);
        }

        const claims = {
        session: {
            company_id: profile?.company_id || null,
        },
        };

        return new Response(JSON.stringify(claims), {
        headers: { 'Content-Type': 'application/json' },
        });
        
    } catch (error) {
        console.error('Error in Token Enricher function:', error);
        return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        });
    }
    });
