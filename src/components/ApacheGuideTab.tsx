import React, { useState } from 'react';
import { 
  Server, 
  Copy, 
  Check, 
  Download, 
  Terminal, 
  CheckCircle2, 
  ShieldCheck, 
  FolderGit2, 
  FileCode, 
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';

export const ApacheGuideTab: React.FC = () => {
  const [copiadoHtaccess, setCopiadoHtaccess] = useState<boolean>(false);
  const [copiadoVhost, setCopiadoVhost] = useState<boolean>(false);
  const [soSelecionado, setSoSelecionado] = useState<'linux' | 'windows' | 'cpanel'>('linux');

  const htaccessContent = `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Redirecionamento SPA: caso o arquivo ou diretório físico não exista, repassa para index.html
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Compressão GZIP para máxima performance no Apache
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css
  AddOutputFilterByType DEFLATE application/javascript application/json application/xml
  AddOutputFilterByType DEFLATE image/svg+xml
</IfModule>

# Cache de arquivos estáticos
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>

# Cabeçalhos de Segurança HTTP
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>`;

  const vhostContent = `<VirtualHost *:80>
    ServerName dejep.sua-unidade.sp.gov.br
    DocumentRoot /var/www/html/dejep

    <Directory /var/www/html/dejep>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog \${APACHE_LOG_DIR}/dejep_error.log
    CustomLog \${APACHE_LOG_DIR}/dejep_access.log combined
</VirtualHost>`;

  const handleCopiarHtaccess = () => {
    navigator.clipboard.writeText(htaccessContent);
    setCopiadoHtaccess(true);
    setTimeout(() => setCopiadoHtaccess(false), 2500);
  };

  const handleCopiarVhost = () => {
    navigator.clipboard.writeText(vhostContent);
    setCopiadoVhost(true);
    setTimeout(() => setCopiadoVhost(false), 2500);
  };

  const handleBaixarHtaccess = () => {
    const blob = new Blob([htaccessContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.htaccess';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Banner de Compatibilidade do Apache */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-wider border border-amber-500/30">
                Deploy em Servidor Web
              </span>
              <span className="text-slate-400 text-xs">Instalação & Configuração Apache 2.4+</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
              <Server className="w-5 h-5 text-amber-400" />
              Execução no Servidor Apache HTTP Server
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Este sistema foi desenvolvido como uma Single Page Application (SPA) 100% autônoma e otimizada para ser hospedada em qualquer servidor <strong>Apache HTTP Server</strong> (Linux Debian/Ubuntu, CentOS, RHEL, Windows com XAMPP/WampServer ou cPanel), sem necessidade de servidores Node em produção.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBaixarHtaccess}
              className="bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Baixar arquivo .htaccess</span>
            </button>
          </div>
        </div>

        {/* Status de Compatibilidade */}
        <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <strong className="text-white block">mod_rewrite Configurado</strong>
              <span className="text-slate-400">Roteamento SPA direto para index.html</span>
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <strong className="text-white block">mod_deflate (GZIP)</strong>
              <span className="text-slate-400">Compressão de assets para carregamento rápido</span>
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <strong className="text-white block">Zero Dependência de Backend</strong>
              <span className="text-slate-400">Funciona em qualquer pasta htdocs / public_html</span>
            </div>
          </div>
        </div>
      </div>

      {/* Passo a Passo de Instalação */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-blue-400" />
          Passo a Passo para Publicação no Apache
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Siga estas 3 etapas simples para colocar o Sistema DEJEP em produção no seu servidor.
        </p>

        {/* Seletor de Ambiente */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xs text-slate-400 font-medium">Selecione seu ambiente:</span>
          <button
            onClick={() => setSoSelecionado('linux')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              soSelecionado === 'linux' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Linux (Ubuntu / Debian / CentOS)
          </button>
          <button
            onClick={() => setSoSelecionado('windows')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              soSelecionado === 'windows' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Windows (XAMPP / WampServer)
          </button>
          <button
            onClick={() => setSoSelecionado('cpanel')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              soSelecionado === 'cpanel' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            cPanel / Hospedagem Compartilhada
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Passo 1 */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="w-7 h-7 rounded-full bg-blue-600/20 text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-500/40 mb-3">
              1
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Gerar o Build de Produção</h4>
            <p className="text-xs text-slate-400 mb-3">
              No diretório do projeto, execute o comando de compilação do Vite:
            </p>
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 flex items-center justify-between">
              <span>npm run build</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Será gerada a pasta <strong className="text-slate-300">dist/</strong> contendo os arquivos estáticos e o <strong className="text-slate-300">.htaccess</strong>.
            </p>
          </div>

          {/* Passo 2 */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="w-7 h-7 rounded-full bg-blue-600/20 text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-500/40 mb-3">
              2
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Copiar para a Pasta do Apache</h4>
            <p className="text-xs text-slate-400 mb-3">
              Copie todo o conteúdo da pasta <code>dist/</code> para a raiz web do Apache:
            </p>
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 break-all">
              {soSelecionado === 'linux' && 'sudo cp -r dist/* /var/www/html/'}
              {soSelecionado === 'windows' && 'Copiar para C:\\xampp\\htdocs\\dejep\\'}
              {soSelecionado === 'cpanel' && 'Upload via FTP para public_html/'}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Certifique-se de que o arquivo oculto <strong className="text-slate-300">.htaccess</strong> foi transferido junto.
            </p>
          </div>

          {/* Passo 3 */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="w-7 h-7 rounded-full bg-blue-600/20 text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-500/40 mb-3">
              3
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Habilitar Módulos no Apache</h4>
            <p className="text-xs text-slate-400 mb-3">
              Ative os módulos essenciais de reescrita e reinicie o serviço:
            </p>
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 space-y-1">
              {soSelecionado === 'linux' ? (
                <>
                  <div>sudo a2enmod rewrite headers deflate expires</div>
                  <div>sudo systemctl restart apache2</div>
                </>
              ) : soSelecionado === 'windows' ? (
                <div>No XAMPP: Verifique se mod_rewrite está ativo no httpd.conf e reinicie o Apache.</div>
              ) : (
                <div>No cPanel: mod_rewrite já vem ativado por padrão. O sistema funcionará imediatamente.</div>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Garante que rotas e navegação interna funcionem perfeitamente.
            </p>
          </div>
        </div>
      </div>

      {/* Visualizador do Arquivo .htaccess */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold text-white font-mono">public/.htaccess</h4>
            <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">
              Incluído no Projeto
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopiarHtaccess}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2.5 py-1.5 rounded-md border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              {copiadoHtaccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiadoHtaccess ? 'Copiado!' : 'Copiar Código'}</span>
            </button>
            <button
              onClick={handleBaixarHtaccess}
              className="bg-amber-600 hover:bg-amber-500 text-white text-xs px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar</span>
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-950">
          <pre className="text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
            {htaccessContent}
          </pre>
        </div>
      </div>

      {/* Modelo de VirtualHost para Apache */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-400" />
            <h4 className="text-sm font-bold text-white font-mono">Exemplo de VirtualHost (Apache 2.4)</h4>
          </div>

          <button
            onClick={handleCopiarVhost}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2.5 py-1.5 rounded-md border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            {copiadoVhost ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiadoVhost ? 'Copiado!' : 'Copiar VirtualHost'}</span>
          </button>
        </div>

        <div className="p-4 bg-slate-950">
          <pre className="text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
            {vhostContent}
          </pre>
        </div>
      </div>
    </div>
  );
};
