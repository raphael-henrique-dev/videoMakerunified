// motor/publish/oauth-helper.js — Servidor local leve para captura de callbacks OAuth2
import http from "node:http";
import { exec } from "node:child_process";

/**
 * Tenta abrir uma URL no navegador padrão do sistema operacional.
 */
export function abrirNavegador(url) {
  const comando =
    process.platform === "win32"
      ? `start "" "${url}"`
      : process.platform === "darwin"
      ? `open "${url}"`
      : `xdg-open "${url}" 2>/dev/null || sensible-browser "${url}" 2>/dev/null || x-www-browser "${url}" 2>/dev/null`;

  exec(comando, (err) => {
    // Falha silenciosa caso seja um terminal headless; a URL sempre é exibida no console.
  });
}

/**
 * Inicia um servidor HTTP local temporário para receber o redirecionamento OAuth.
 * @param {number} porta - Porta local (padrão 3000)
 * @param {string} rotaCallback - Rota esperada (ex: '/oauth2callback')
 * @returns {Promise<{ code: string }>}
 */
export function aguardarCallbackOAuth(porta = 3000, rotaCallback = "/oauth2callback") {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const parsedUrl = new URL(req.url, `http://localhost:${porta}`);
        const pathNormalizado = parsedUrl.pathname.replace(/\/$/, "");
        const rotaNormalizada = rotaCallback.replace(/\/$/, "");
        if (
          pathNormalizado === rotaNormalizada ||
          pathNormalizado === "/oauth2callback" ||
          pathNormalizado === "/callback" ||
          parsedUrl.pathname === "/"
        ) {
          const code = parsedUrl.searchParams.get("code");
          const error = parsedUrl.searchParams.get("error");

          if (error) {
            res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
            res.end(`
              <!DOCTYPE html>
              <html>
              <head><meta charset="utf-8"><title>Erro de Autenticação</title></head>
              <body style="font-family:sans-serif;background:#0f172a;color:#f8fafc;padding:40px;text-align:center;">
                <h1 style="color:#ef4444;">❌ Erro na Autorização</h1>
                <p>O provedor retornou o erro: <strong>${error}</strong></p>
                <p>Você pode fechar esta aba e tentar novamente no terminal.</p>
              </body>
              </html>
            `);
            server.close();
            return reject(new Error(`Autorização rejeitada pelo provedor: ${error}`));
          }

          if (code) {
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
            res.end(`
              <!DOCTYPE html>
              <html>
              <head><meta charset="utf-8"><title>Autorização Concluída</title></head>
              <body style="font-family:sans-serif;background:#050a14;color:#f8fafc;padding:40px;text-align:center;">
                <div style="max-width:500px;margin:auto;background:#0f172a;padding:32px;border-radius:16px;border:1px solid #38bdf8;">
                  <h1 style="color:#22c55e;margin-top:0;">✅ Autorização Concluída!</h1>
                  <p style="color:#cbd5e1;font-size:17px;">Os tokens de acesso foram recebidos com sucesso pelo Motor 2.0.</p>
                  <p style="color:#94a3b8;font-size:14px;">Você já pode fechar esta janela e retornar ao seu terminal.</p>
                </div>
              </body>
              </html>
            `);
            server.close();
            return resolve({ code });
          }
        }

        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Aguardando callback OAuth do Motor 2.0...");
      } catch (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Erro interno no servidor de callback.");
        server.close();
        reject(err);
      }
    });

    server.on("error", (err) => {
      reject(err);
    });

    server.listen(porta, () => {
      // Servidor pronto para receber a requisição
    });

    // Timeout de segurança de 3 minutos para não prender o terminal indefinidamente
    setTimeout(() => {
      try {
        server.close();
      } catch {}
      reject(new Error("Tempo esgotado aguardando autorização no navegador (timeout de 3 minutos)."));
    }, 180000);
  });
}
