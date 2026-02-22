export default function DebugEnvPage() {
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasPublishableKey = !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
  const hasAnyKey = hasPublishableKey || hasAnonKey

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const urlPreview = url ? `${url.substring(0, 20)}...` : 'NOT SET'
  const publishableKeyPreview = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ? `${process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.substring(0, 20)}...`
    : 'NOT SET'
  const anonKeyPreview = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...`
    : 'NOT SET'

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Debug: Variables de Entorno</h1>

        <div className="space-y-4">
          <div>
            <h2 className="font-semibold mb-2">NEXT_PUBLIC_SUPABASE_URL</h2>
            <div className={`p-3 rounded ${hasUrl ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {hasUrl ? `✅ Configurada: ${urlPreview}` : '❌ NO CONFIGURADA'}
            </div>
            {url && (
              <p className="text-sm text-gray-600 mt-1">URL completa: {url}</p>
            )}
          </div>

          <div>
            <h2 className="font-semibold mb-2">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</h2>
            <div className={`p-3 rounded ${hasPublishableKey ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
              {hasPublishableKey ? `✅ Configurada: ${publishableKeyPreview}` : '⚠️ No configurada (usando anon key como fallback)'}
            </div>
          </div>

          <div>
            <h2 className="font-semibold mb-2">NEXT_PUBLIC_SUPABASE_ANON_KEY</h2>
            <div className={`p-3 rounded ${hasAnonKey ? 'bg-green-50 text-green-800' : hasPublishableKey ? 'bg-gray-50 text-gray-600' : 'bg-red-50 text-red-800'}`}>
              {hasAnonKey ? `✅ Configurada: ${anonKeyPreview}` : hasPublishableKey ? 'ℹ️ No necesaria (usando publishable key)' : '❌ NO CONFIGURADA'}
            </div>
          </div>

          <div>
            <h2 className="font-semibold mb-2">SUPABASE_SERVICE_ROLE_KEY</h2>
            <div className={`p-3 rounded ${hasServiceKey ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
              {hasServiceKey ? '✅ Configurada' : '⚠️ No configurada (opcional)'}
            </div>
          </div>

          {(!hasUrl || !hasAnyKey) && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded">
              <h3 className="font-semibold text-red-800 mb-2">⚠️ Acción Requerida</h3>
              <p className="text-sm text-red-700">
                Por favor, agrega las variables faltantes a tu archivo <code className="bg-red-100 px-1 rounded">.env.local</code> y reinicia el servidor de desarrollo.
              </p>
              <p className="text-sm text-red-700 mt-2">
                Necesitas: <code className="bg-red-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> y
                {' '}<code className="bg-red-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> (recomendado) o
                {' '}<code className="bg-red-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
