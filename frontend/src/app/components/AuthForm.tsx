'use client';

import { useState } from 'react';

export default function AuthForm() {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);

    if (!token.trim()) {
      setMessage({ type: 'error', text: 'Por favor, insira um token.' });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/integration/rdstation-crm/authenticate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Ocorreu um erro na autenticação.');
      }

      setMessage({
        type: 'success',
        text: data.message || 'Autenticação bem-sucedida!',
      });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
        <h1 className="mb-4 text-center text-2xl font-bold text-gray-900 dark:text-white">
          Conectar com RD Station CRM
        </h1>
        <p className="mb-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Para começar, precisamos do seu Token da Instância do RD Station CRM.
        </p>

        <div className="mb-6 rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700">
          <h2 className="mb-2 font-semibold text-gray-800 dark:text-gray-200">
            Como encontrar seu Token:
          </h2>
          <ol className="list-inside list-decimal space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <li>
              Acesse seu{' '}
              <a
                href="https://crm.rdstation.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline dark:text-blue-500"
              >
                perfil no RD Station CRM
              </a>
              .
            </li>
            <li>
              Clique no seu nome (canto superior direito) e vá em{' '}
              <strong>&quot;Perfil &amp; Preferências&quot;</strong>.
            </li>
            <li>
              Na nova tela, selecione a aba{' '}
              <strong>&quot;Integrações&quot;</strong>.
            </li>
            <li>
              Copie o <strong>&quot;Token da instância&quot;</strong> e cole no
              campo abaixo.
            </li>
          </ol>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="token"
              className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-300"
            >
              Seu Token da Instância
            </label>
            <input
              type="text"
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Cole seu token aqui"
              required
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 focus:outline-none disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Conectando...' : 'Conectar'}
          </button>
        </form>
        {message && (
          <div
            className={`mt-4 rounded-lg p-4 text-sm ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}
            role="alert"
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}