import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    // Força a injeção das variáveis Supabase no client-side
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    // Outras variáveis importantes
    NEXT_PUBLIC_ASTERISK_HOST: process.env.NEXT_PUBLIC_ASTERISK_HOST || 'localhost',
    NEXT_PUBLIC_ASTERISK_WSS_PORT: process.env.NEXT_PUBLIC_ASTERISK_WSS_PORT || '8089',
    NEXT_PUBLIC_AGENT_ID: process.env.NEXT_PUBLIC_AGENT_ID || 'agent-1001-wss',
    NEXT_PUBLIC_ASTERISK_REALM: process.env.NEXT_PUBLIC_ASTERISK_REALM || 'clicktocall.local',
    NEXT_PUBLIC_AGENT_PASSWORD: process.env.NEXT_PUBLIC_AGENT_PASSWORD || '',
  }
};

export default nextConfig;
