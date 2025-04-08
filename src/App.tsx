import React, { useState, useEffect } from 'react';
import { Send, Loader2, Code2, Palette, Globe2, Sparkles, Github, Gitlab as GitlabLogo } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with proper error handling
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const templates: Template[] = [
  {
    id: 'portfolio',
    name: 'Portfólio Profissional',
    description: 'Site perfeito para mostrar seus trabalhos e experiência',
    icon: <Code2 className="w-6 h-6" />,
  },
  {
    id: 'business',
    name: 'Site Empresarial',
    description: 'Apresente sua empresa com um design moderno',
    icon: <Globe2 className="w-6 h-6" />,
  },
  {
    id: 'landing',
    name: 'Landing Page',
    description: 'Página de conversão otimizada para seu produto',
    icon: <Sparkles className="w-6 h-6" />,
  },
  {
    id: 'creative',
    name: 'Site Criativo',
    description: 'Design único para projetos artísticos',
    icon: <Palette className="w-6 h-6" />,
  },
];

function App() {
  const [prompt, setPrompt] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [deployUrl, setDeployUrl] = useState('');
  const [session, setSession] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async (provider: 'github' | 'gitlab') => {
    setIsAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error(`Erro ao fazer login com ${provider === 'github' ? 'GitHub' : 'GitLab'}. Tente novamente.`);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logout realizado com sucesso');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Erro ao fazer logout. Tente novamente.');
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user) {
      toast.error('Faça login para gerar um site');
      return;
    }

    setIsGenerating(true);
    toast.loading('Iniciando geração do site...');

    try {
      // Store the generation request in Supabase
      const { error } = await supabase
        .from('site_generations')
        .insert([
          {
            prompt,
            template: selectedTemplate,
            status: 'processing',
            user_id: session.user.id // Set the user_id to the authenticated user's ID
          }
        ]);

      if (error) throw error;

      // Simulate API call to Netlify
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const demoUrl = `https://demo-${Math.random().toString(36).substring(7)}.netlify.app`;
      setDeployUrl(demoUrl);
      
      toast.success('Site gerado com sucesso!');
      
      // Update generation status
      await supabase
        .from('site_generations')
        .update({ status: 'completed', deploy_url: demoUrl })
        .eq('prompt', prompt)
        .eq('user_id', session.user.id);

    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao gerar o site. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800">
              Gerador de Sites Automático
            </h1>
            {!session ? (
              <div className="flex gap-2">
                <button
                  onClick={() => handleSignIn('github')}
                  disabled={isAuthLoading}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Github className="w-5 h-5" />
                  GitHub
                </button>
                <button
                  onClick={() => handleSignIn('gitlab')}
                  disabled={isAuthLoading}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-500 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <GitlabLogo className="w-5 h-5" />
                  GitLab
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-gray-600">
                  {session.user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Sair
                </button>
              </div>
            )}
          </div>

          <p className="text-gray-600 mb-8">
            Escolha um template, descreva o site que você deseja criar e deixe a mágica acontecer!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedTemplate === template.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="flex items-center justify-center mb-3 text-purple-600">
                  {template.icon}
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">{template.name}</h3>
                <p className="text-sm text-gray-600">{template.description}</p>
              </button>
            ))}
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label 
                htmlFor="prompt" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Descreva seu site
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full h-32 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Ex: Quero um site profissional com seção sobre mim, galeria de projetos, blog e formulário de contato..."
              />
            </div>

            <button
              type="submit"
              disabled={isGenerating || !prompt.trim() || !selectedTemplate || !session}
              className={`w-full flex items-center justify-center px-6 py-3 text-white rounded-lg text-lg font-medium transition-colors
                ${isGenerating || !prompt.trim() || !selectedTemplate || !session
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-purple-600 hover:bg-purple-700'}`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin mr-2" />
                  Gerando seu site...
                </>
              ) : (
                <>
                  <Send className="mr-2" />
                  Gerar Site
                </>
              )}
            </button>
          </form>

          {deployUrl && (
            <div className="mt-6 p-6 bg-green-50 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                🎉 Seu site está pronto!
              </h3>
              <p className="text-green-700 mb-4">
                Acesse seu novo site no endereço:
              </p>
              <a
                href={deployUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full p-4 bg-white rounded-lg border border-green-200 text-center text-green-700 hover:bg-green-50 transition-colors"
              >
                {deployUrl}
              </a>
            </div>
          )}
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;