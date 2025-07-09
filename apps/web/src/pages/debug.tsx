export default function DebugPage() {
  if (typeof window === 'undefined') {
    return <div>Loading...</div>
  }

  // Capturar todas as variáveis de ambiente disponíveis no client-side
  const allEnvVars = Object.keys(process.env || {})
  const nextPublicVars = allEnvVars.filter(key => key.startsWith('NEXT_PUBLIC'))
  
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🔍 Debug - Environment Variables</h1>
      
      <h2>📋 All Available Environment Variables:</h2>
      <div style={{ background: '#f0f0f0', padding: '10px', borderRadius: '5px' }}>
        <pre>{JSON.stringify(allEnvVars, null, 2)}</pre>
      </div>
      
      <h2>🔑 NEXT_PUBLIC Variables:</h2>
      <div style={{ background: '#e8f5e8', padding: '10px', borderRadius: '5px' }}>
        <pre>{JSON.stringify(nextPublicVars, null, 2)}</pre>
      </div>
      
      <h2>🎯 Supabase Variables:</h2>
      <div style={{ background: '#f0f8ff', padding: '10px', borderRadius: '5px' }}>
        <ul>
          <li>
            <strong>NEXT_PUBLIC_SUPABASE_URL:</strong> 
            <code>{process.env.NEXT_PUBLIC_SUPABASE_URL || 'undefined'}</code>
          </li>
          <li>
            <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong> 
            <code>
              {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
                ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + '...' 
                : 'undefined'}
            </code>
          </li>
        </ul>
      </div>
      
      <h2>⚙️ System Info:</h2>
      <div style={{ background: '#fff8dc', padding: '10px', borderRadius: '5px' }}>
        <ul>
          <li><strong>NODE_ENV:</strong> {process.env.NODE_ENV}</li>
          <li><strong>Window exists:</strong> {typeof window !== 'undefined' ? 'Yes' : 'No'}</li>
          <li><strong>Process env exists:</strong> {typeof process.env !== 'undefined' ? 'Yes' : 'No'}</li>
        </ul>
      </div>
    </div>
  )
} 