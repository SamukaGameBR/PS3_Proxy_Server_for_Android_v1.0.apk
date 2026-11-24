import express from 'express';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { URL } from 'node:url';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const APP_VERSION = 2.3;
const UPLOADS_DIR = '/tmp/ppsfa_uploads';

interface ProxyConfig {
  ip: string;
  port: number;
  customPs3Updatelist: boolean;
  manualPs3Updatelist: boolean;
  pathPs3Updatelist: string;
  customRulesUrls: string;
  whatsNewPsxPlaceNews: boolean;
  whatsNewRssFeed: boolean;
  whatsNewRssFeedUrl: string;
  psStorePsxPlaceNews: boolean;
  psStoreRssFeed: boolean;
  psStoreRssFeedUrl: string;
  tvVideoServicesPsxPlaceNews: boolean;
  tvVideoServicesRssFeed: boolean;
  tvVideoServicesRssFeedUrl: string;
  psxPlaceXmlUrl: string;
}

interface LogEntry {
  ln: number;
  sessionId: number;
  isRequest: boolean;
  timestamp: string;
  tag: string;
  message: string;
  detail?: string;
}

const REGIONS: Record<string, { region: string; dest: string; code: string }> = {
  jp: { region: 'JP', dest: '83', code: 'jp' },
  us: { region: 'US', dest: '84', code: 'us' },
  eu: { region: 'EU', dest: '85', code: 'eu' },
  kr: { region: 'KR', dest: '86', code: 'kr' },
  uk: { region: 'UK', dest: '87', code: 'uk' },
  mx: { region: 'MX', dest: '88', code: 'mx' },
  au: { region: 'AU/NZ', dest: '89', code: 'au' },
  sa: { region: 'SouthAsia', dest: '8A', code: 'sa' },
  tw: { region: 'TW', dest: '8B', code: 'tw' },
  ru: { region: 'RU', dest: '8C', code: 'ru' },
  cn: { region: 'CN', dest: '8D', code: 'cn' },
  br: { region: 'BR', dest: '8F', code: 'br' },
};

function formatTimestamp(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function getLocalIpAddress(): string {
  try {
    const ifaces = os.networkInterfaces();
    for (const name of Object.keys(ifaces)) {
      const addrs = ifaces[name];
      if (!addrs) continue;
      for (const addr of addrs) {
        if (!addr.internal && addr.family === 'IPv4') {
          return addr.address;
        }
      }
    }
  } catch {
    // ignore
  }
  return 'localhost';
}

async function fetchText(targetUrl: string): Promise<string> {
  if (targetUrl.startsWith('local://whats_new.xml')) {
    const localPath = path.resolve(process.cwd(), 'Whats_New_XML/whats_new.xml');
    if (fs.existsSync(localPath)) {
      return fs.promises.readFile(localPath, 'utf-8');
    }
  }
  const resp = await fetch(targetUrl, { signal: AbortSignal.timeout(8000) });
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status}`);
  }
  return await resp.text();
}

async function getPicturesUrls(xmlUrl: string, ps3LikeXml: boolean): Promise<string[]> {
  if (!xmlUrl || xmlUrl === 'NONE_PPSFA') return [];
  let xml = '';
  try {
    xml = await fetchText(xmlUrl);
  } catch {
    if (xmlUrl.includes('whats_new.xml')) {
      const localPath = path.resolve(process.cwd(), 'Whats_New_XML/whats_new.xml');
      if (fs.existsSync(localPath)) {
        xml = await fs.promises.readFile(localPath, 'utf-8');
      } else {
        return [];
      }
    } else {
      return [];
    }
  }

  const picturesUrls: string[] = [];

  if (!ps3LikeXml) {
    const parts = xml.split('"');
    for (const part of parts) {
      if ((part.includes('.jpg') || part.includes('.png')) && !picturesUrls.includes(part)) {
        picturesUrls.push(part);
      }
    }
    return picturesUrls;
  }

  const mtrlParts = xml.split('<mtrl');
  const currentYear = new Date().getFullYear();
  for (let i = 1; i < mtrlParts.length; i++) {
    const part = mtrlParts[i];
    const untilMatch = part.match(/until="(\d{4})-/);
    const year = untilMatch ? parseInt(untilMatch[1], 10) : 2100;
    if (year >= currentYear) {
      const urlMatch = part.match(/<url[^>]*>(https?:\/\/[^<]+\.(?:jpg|png))<\/url>/i);
      if (urlMatch && urlMatch[1]) {
        picturesUrls.push(urlMatch[1]);
      }
    }
  }
  return picturesUrls;
}

class ProxyManager {
  private server: http.Server | null = null;
  private running = false;
  private sessionId = 0;
  private logNum = 0;
  private logs: LogEntry[] = [];
  private lastError = '';
  private activeIp = 'localhost';
  private activePort = 8080;
  private config: ProxyConfig | null = null;

  private addLog(isRequest: boolean, tag: string, message: string, detail?: string) {
    const entry: LogEntry = {
      ln: this.logNum++,
      sessionId: this.sessionId,
      isRequest,
      timestamp: formatTimestamp(),
      tag,
      message,
      detail,
    };
    this.logs.push(entry);
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
  }

  public getStatus() {
    return {
      running: this.running,
      ip: this.activeIp,
      port: this.activePort,
      sessionId: this.sessionId,
      error: this.lastError,
      logsCount: this.logs.length,
    };
  }

  public getLogs(seeRequests: boolean) {
    return this.logs.filter((entry) => !entry.isRequest || seeRequests);
  }

  public clearLogs() {
    this.logs = [];
    this.logNum = 0;
  }

  private parseCustomRules(raw: string): Array<{ sourceUrl: string; targetPath: string }> {
    const rules: Array<{ sourceUrl: string; targetPath: string }> = [];
    const lines = raw.split(/\r?\n/);
    for (let line of lines) {
      line = line.trim();
      if (!line || !line.includes(' --> ')) continue;
      const parts = line.split(' --> ');
      if (parts.length < 2) continue;
      let sourceUrl = parts[0].trim();
      const targetPath = parts.slice(1).join(' --> ').trim();
      if (!sourceUrl.startsWith('http')) {
        sourceUrl = `http://${sourceUrl}`;
      }
      if (sourceUrl.endsWith('/')) {
        sourceUrl = sourceUrl.slice(0, -1);
      }
      rules.push({ sourceUrl, targetPath });
    }
    return rules;
  }

  public async start(config: ProxyConfig): Promise<{ ok: boolean; error?: string }> {
    if (this.running) {
      await this.stop();
    }

    this.lastError = '';
    this.clearLogs();
    this.sessionId = 10000 + Math.floor(Math.random() * (999999999 - 10000 + 1));
    this.config = config;
    this.activeIp = config.ip || getLocalIpAddress();
    this.activePort = config.port || 8080;

    if (this.activePort === PORT) {
      this.lastError = `A porta ${PORT} é reservada pela interface web`;
      return { ok: false, error: this.lastError };
    }

    const customRules = this.parseCustomRules(config.customRulesUrls);

    const server = http.createServer(async (req, res) => {
      const rawUrl = req.url || '/';
      const fullUrl = rawUrl.startsWith('http') ? rawUrl : `http://${req.headers.host || 'localhost'}${rawUrl}`;
      this.addLog(true, '[*]', `HTTP acessado -- ${fullUrl}`);

      try {
        const parsed = new URL(fullUrl);

        // 1. PS3 ps3-updatelist.txt redirection
        if (
          config.customPs3Updatelist &&
          /f..01\.ps3\.update\.playstation\.net\/update\/ps3\/list\/..\/ps3-updatelist\.txt/i.test(fullUrl)
        ) {
          const regionCode = parsed.pathname.slice(17, 19).toLowerCase();
          const region = REGIONS[regionCode];
          if (region) {
            if (!config.manualPs3Updatelist) {
              const body = `# ${region.region}\r\nDest=${region.dest};ImageVersion=00000000;SystemSoftwareVersion=0.00;CDN=http://d${region.code}01.ps3.update.playstation.net/update/ps3/image/${region.code}/nodata;CDN_Timeout=30;`;
              this.addLog(false, '[+]', 'Arquivo ps3-updatelist.txt do PS3 redirecionado');
              res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
              res.end(body);
              return;
            } else {
              const filePath = config.pathPs3Updatelist;
              if (!filePath || filePath === 'NONE' || !fs.existsSync(filePath)) {
                this.addLog(false, '[/\\_\\]', 'ERRO 404 (Arquivo não encontrado) em: Consulta de atualização do PS3 redirecionada');
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(
                  `<center><font size='6'>-----Servidor Proxy PS3 para Android-----</font><p><font size='5'>ERRO 404 - Arquivo não encontrado</font></p><p><font size='4'>Verifique o caminho do arquivo informado -- ${filePath}</font></p></center>`
                );
                return;
              }
              let templateText = await fs.promises.readFile(filePath, 'utf-8');
              templateText = templateText
                .replace(/\{\{\.Region\}\}/g, region.region)
                .replace(/\{\{\.Dest\}\}/g, region.dest)
                .replace(/\{\{\.Code\}\}/g, region.code);
              this.addLog(false, '[+]', 'Arquivo ps3-updatelist.txt do PS3 redirecionado');
              res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
              res.end(templateText);
              return;
            }
          } else {
            this.addLog(
              false,
              '[/\\_\\]',
              'AVISO - Erro ao analisar sua região. A consulta de atualização do PS3 NÃO será redirecionada.'
            );
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(
              `<center><font size='6'>-----Servidor Proxy PS3 para Android-----</font><p><font size='5'>AVISO - Erro ao analisar sua região</font></p><p><font size='4'>A consulta de atualização do PS3 NÃO será redirecionada.</font></p></center>`
            );
            return;
          }
        }

        // 2. Custom URL redirection rules
        const normalizedUrl = fullUrl.endsWith('/') ? fullUrl.slice(0, -1) : fullUrl;
        for (const rule of customRules) {
          if (normalizedUrl === rule.sourceUrl) {
            if (!fs.existsSync(rule.targetPath)) {
              this.addLog(
                false,
                '[/\\_\\]',
                `ERRO 404 (Arquivo não encontrado) em: URLs personalizadas -- URL Original: ${rule.sourceUrl} || Redirecionado para: ${rule.targetPath}`
              );
              res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end(
                `<center><font size='6'>-----Servidor Proxy PS3 para Android-----</font><p><font size='5'>ERRO 404 - Arquivo não encontrado</font></p><p><font size='4'>Verifique o caminho do arquivo informado -- ${rule.targetPath}</font></p></center>`
              );
              return;
            }
            const fileData = await fs.promises.readFile(rule.targetPath);
            this.addLog(
              false,
              '[-]',
              `URLs personalizadas -- URL Original: ${rule.sourceUrl} || Redirecionado para: ${rule.targetPath}`
            );
            res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
            res.end(fileData);
            return;
          }
        }

        // 3. Picture redirection (What's New / PS Store / TV & Video Services)
        let targetFetchUrl = fullUrl;
        const whatsNewRedirect = config.whatsNewPsxPlaceNews || config.whatsNewRssFeed;
        const psStoreRedirect = config.psStorePsxPlaceNews || config.psStoreRssFeed;
        const tvRedirect = config.tvVideoServicesPsxPlaceNews || config.tvVideoServicesRssFeed;

        if (
          (fullUrl.includes('.jpg') || fullUrl.includes('.png')) &&
          fullUrl.includes('http://nsx.np.dl.playstation.net/nsx/material/') &&
          (whatsNewRedirect || psStoreRedirect || tvRedirect)
        ) {
          const country = fullUrl.slice(-2).toUpperCase();
          const baseUrl = fullUrl.split('?')[0];
          const [whatsNewPics, psStorePics] = await Promise.all([
            getPicturesUrls(
              `https://nsx.sec.np.dl.playstation.net/nsx/sec/Xz78TMQ1Uf31VCYr/c/NSXWSV/NSXWSV-PN.P3.${country}-WHATSNEW00000001.xml`,
              true
            ),
            getPicturesUrls(
              `https://nsx.sec.np.dl.playstation.net/nsx/sec/Xz78TMQ1Uf31VCYr/c/NSXWSV/NSXWSV-PN.P3.GAME.${country}-BILLBOARD0000001.xml`,
              true
            ),
          ]);

          let pictureNum = -1;
          let typeRedirect = '';

          if (tvRedirect) {
            const tvPics = await getPicturesUrls(
              `https://nsx.sec.np.dl.playstation.net/nsx/sec/Xz78TMQ1Uf31VCYr/c/NSXWSV/NSXWSV-PN.P3.${country}-XMB_TV_INSTALL01.xml`,
              true
            );
            const idx = tvPics.indexOf(baseUrl);
            if (idx !== -1) {
              pictureNum = idx;
              typeRedirect = 'TV/Video Services';
            }
          }
          if (pictureNum === -1 && psStoreRedirect && !whatsNewRedirect) {
            const idx = psStorePics.indexOf(baseUrl);
            if (idx !== -1) {
              pictureNum = idx;
              typeRedirect = 'PS Store';
            }
          }
          if (pictureNum === -1 && whatsNewRedirect) {
            const idx = whatsNewPics.indexOf(baseUrl);
            if (idx !== -1) {
              pictureNum = idx;
              typeRedirect = psStoreRedirect ? "What's New(/PS Store)" : "What's New";
            }
          }

          if (pictureNum !== -1) {
            const sourceFeedUrl =
              typeRedirect.startsWith("What's New")
                ? config.whatsNewPsxPlaceNews
                  ? config.psxPlaceXmlUrl || 'local://whats_new.xml'
                  : config.whatsNewRssFeedUrl
                : typeRedirect === 'PS Store'
                  ? config.psStorePsxPlaceNews
                    ? config.psxPlaceXmlUrl || 'local://whats_new.xml'
                    : config.psStoreRssFeedUrl
                  : config.tvVideoServicesPsxPlaceNews
                    ? config.psxPlaceXmlUrl || 'local://whats_new.xml'
                    : config.tvVideoServicesRssFeedUrl;

            const isPs3Like =
              (typeRedirect.startsWith("What's New") && config.whatsNewPsxPlaceNews) ||
              (typeRedirect === 'PS Store' && config.psStorePsxPlaceNews) ||
              (typeRedirect === 'TV/Video Services' && config.tvVideoServicesPsxPlaceNews);

            const replacementPics = await getPicturesUrls(sourceFeedUrl, isPs3Like);
            const redirectedPic = replacementPics[pictureNum];
            if (redirectedPic) {
              targetFetchUrl = redirectedPic;
              this.addLog(
                false,
                '[/]',
                `Imagem (${typeRedirect}) redirecionada -- URL Original: ${fullUrl} || Redirecionado para: ${redirectedPic}`
              );
            }
          }
        }

        // 4. Forward standard HTTP proxy request
        const target = new URL(targetFetchUrl);
        const proxyReq = http.request(
          {
            hostname: target.hostname,
            port: target.port || 80,
            path: target.pathname + target.search,
            method: req.method,
            headers: {
              ...req.headers,
              host: target.host,
            },
          },
          (proxyRes) => {
            res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
            proxyRes.pipe(res);
          }
        );

        proxyReq.on('error', (err) => {
          if (!res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end(`Erro no proxy: ${err.message}`);
          }
        });

        req.pipe(proxyReq);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro no proxy';
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end(message);
        }
      }
    });

    server.on('connect', (req, clientSocket, head) => {
      const [host, portStr] = (req.url || '').split(':');
      const targetPort = Number(portStr) || 443;
      this.addLog(true, '[*]', `HTTPS acessado -- https://${req.url}`);

      const serverSocket = net.connect(targetPort, host, () => {
        clientSocket.write('HTTP/1.1 200 Connection Established\r\nProxy-agent: PS3-Proxy-Server\r\n\r\n');
        if (head && head.length > 0) {
          serverSocket.write(head);
        }
        serverSocket.pipe(clientSocket);
        clientSocket.pipe(serverSocket);
      });

      serverSocket.on('error', () => {
        clientSocket.end();
      });
      clientSocket.on('error', () => {
        serverSocket.end();
      });
    });

    return new Promise((resolve) => {
      const bindHost = this.activeIp === 'localhost' ? '127.0.0.1' : this.activeIp;

      const onError = (err: Error) => {
        this.running = false;
        this.server = null;
        this.lastError = err.message;
        this.addLog(false, '[/\\_\\ ERRO /_\\]', `Servidor Proxy PS3 interrompido em ${this.activeIp}:${this.activePort}`);
        resolve({ ok: false, error: err.message });
      };

      server.once('error', onError);
      server.listen(this.activePort, bindHost, () => {
        server.removeListener('error', onError);
        server.on('error', (err) => {
          this.lastError = err.message;
          this.addLog(false, '[/\\_\\ ERRO /_\\]', `Servidor Proxy PS3 interrompido em ${this.activeIp}:${this.activePort}`);
        });
        this.server = server;
        this.running = true;
        this.addLog(false, '[*]', `Servidor Proxy PS3 iniciado em ${this.activeIp}:${this.activePort}`);
        resolve({ ok: true });
      });
    });
  }

  public async stop(): Promise<void> {
    if (!this.server) {
      this.running = false;
      return;
    }
    const srv = this.server;
    this.server = null;
    this.running = false;
    await new Promise<void>((resolve) => {
      srv.close(() => resolve());
    });
    this.addLog(false, '[!]', `Servidor Proxy PS3 parado em ${this.activeIp}:${this.activePort}`);
  }
}

const proxyManager = new ProxyManager();

async function startApp() {
  await fs.promises.mkdir(UPLOADS_DIR, { recursive: true });

  const app = express();
  app.use(express.json({ limit: '25mb' }));

  app.get('/api/ip', (_req, res) => {
    res.json({ ip: getLocalIpAddress() });
  });

  app.get('/api/status', (_req, res) => {
    res.json(proxyManager.getStatus());
  });

  app.post('/api/start', async (req, res) => {
    const body = req.body as ProxyConfig;
    const portNum = Number(body.port);
    if (!Number.isInteger(portNum) || portNum < 1024 || portNum > 65535) {
      return res.status(400).json({ ok: false, error: 'INVALID_PORT' });
    }
    const result = await proxyManager.start({ ...body, port: portNum });
    res.json({ ...result, status: proxyManager.getStatus() });
  });

  app.post('/api/stop', async (_req, res) => {
    await proxyManager.stop();
    res.json({ ok: true, status: proxyManager.getStatus() });
  });

  app.post('/api/restart', async (req, res) => {
    const body = req.body as ProxyConfig;
    const portNum = Number(body.port);
    if (!Number.isInteger(portNum) || portNum < 1024 || portNum > 65535) {
      return res.status(400).json({ ok: false, error: 'INVALID_PORT' });
    }
    await proxyManager.stop();
    const result = await proxyManager.start({ ...body, port: portNum });
    res.json({ ...result, status: proxyManager.getStatus() });
  });

  app.get('/api/logs', (req, res) => {
    const seeRequests = req.query.seeRequests === 'true';
    res.json({
      logs: proxyManager.getLogs(seeRequests),
      status: proxyManager.getStatus(),
    });
  });

  app.post('/api/upload-rule-file', async (req, res) => {
    try {
      const { filename, contentBase64 } = req.body as { filename?: string; contentBase64?: string };
      if (!filename || typeof contentBase64 !== 'string') {
        return res.status(400).json({ error: 'Nome do arquivo ou conteúdo ausente' });
      }
      const safeName = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
      const targetPath = path.join(UPLOADS_DIR, safeName);
      const buffer = Buffer.from(contentBase64, 'base64');
      await fs.promises.writeFile(targetPath, buffer);
      res.json({ path: targetPath });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha no envio';
      res.status(500).json({ error: message });
    }
  });

  app.get('/api/check-updates', async (_req, res) => {
    let updatesTxt = '';
    try {
      const localUpdatesPath = path.resolve(process.cwd(), 'UPDATES.txt');
      try {
        const resp = await fetch(
          'https://raw.githubusercontent.com/Edw590/PS3-Proxy-Server-for-Android/master/UPDATES.txt',
          { signal: AbortSignal.timeout(4000) }
        );
        if (resp.ok) {
          updatesTxt = await resp.text();
        }
      } catch {
        // Fallback to local UPDATES.txt
      }
      if (!updatesTxt && fs.existsSync(localUpdatesPath)) {
        updatesTxt = await fs.promises.readFile(localUpdatesPath, 'utf-8');
      }
      if (!updatesTxt) {
        return res.status(502).json({ error: 'Falha ao carregar atualizações' });
      }

      let updateFound = false;
      let downloadLink = 'NONE';
      let psxPlaceXmlUrl = 'https://raw.githubusercontent.com/Edw590/PS3-Proxy-Server-for-Android/master/Whats_New_XML/whats_new.xml';

      const lines = updatesTxt.split(/\r?\n/);
      for (const line of lines) {
        if (line.includes(' --> ')) {
          const parts = line.split(' --> ');
          if (parts[1] && parts[1].startsWith('http')) {
            const ver = parseFloat(parts[0].split(' ')[0]);
            if (!Number.isNaN(ver) && ver > APP_VERSION) {
              downloadLink = parts[1].trim();
              updateFound = true;
            }
          }
        }
        if (line.startsWith('>') && line.includes('PSX-Place news XML URL') && line.includes(' -> ')) {
          const parts = line.split(' -> ');
          if (parts[1]) {
            psxPlaceXmlUrl = parts[1].trim();
          }
        }
      }

      res.json({
        updateFound,
        downloadLink,
        psxPlaceXmlUrl,
        updatesTxt,
        currentVersion: APP_VERSION.toFixed(1),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao verificar atualizações';
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PS3 Proxy Server for Android web UI listening on http://0.0.0.0:${PORT}`);
  });
}

startApp();
