// ============================================================
// NexusBot API Server — Production-Grade (Multi-User/Scale)
// ============================================================
require('dotenv').config();

const cluster = require('cluster');
const os = require('os');
const { processCampaigns } = require('./workers');
const http = require('http');
const https = require('https');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const morgan = require('morgan');
const helmet = require('helmet');
const compress = require('compression');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs'); // Added fs require
const { OpenAI } = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});
// ──────────────────────────────────────────────────────────────
// CLUSTER: spawn one worker per CPU core
// ──────────────────────────────────────────────────────────────
const NUM_WORKERS = Math.max(2, os.cpus().length);

/*
if (cluster.isPrimary) {
    console.log(`[CLUSTER] Master PID ${process.pid} — spawning ${NUM_WORKERS} workers`);
    for (let i = 0; i < NUM_WORKERS; i++) cluster.fork();
    cluster.on('exit', (worker, code) => {
        console.warn(`[CLUSTER] Worker ${worker.process.pid} died (code ${code}). Restarting...`);
        cluster.fork();
    });
    return; // primary does nothing else
}
*/

// ──────────────────────────────────────────────────────────────
// AXIOS — persistent keep-alive connections to Wuzapi
// ──────────────────────────────────────────────────────────────
const keepAliveAgent = new http.Agent({ keepAlive: true, maxSockets: 50, maxFreeSockets: 10 });
const keepAliveAgentHttps = new https.Agent({ keepAlive: true, maxSockets: 50, maxFreeSockets: 10 });

const wuzapi = axios.create({
    baseURL: process.env.WUZAPI_URL,
    timeout: 15000,
    httpAgent: keepAliveAgent,
    httpsAgent: keepAliveAgentHttps,
    headers: { 'Content-Type': 'application/json' },
});

// Admin requests share the same pool but add Auth header
const wuzapiAdmin = (extraHeaders = {}) =>
    wuzapi.request.bind({ ...wuzapi.defaults, headers: { ...wuzapi.defaults.headers, Authorization: process.env.WUZAPI_ADMIN_TOKEN, ...extraHeaders } });

// Helper: normalize base64 prefix for Wuzapi
const normalizeBase64 = (str, forceMime) => {
    if (typeof str !== 'string') return str;
    if (!str.startsWith('data:')) return str;
    if (forceMime) {
        return str.replace(/^data:[^;]+;base64,/, `data:${forceMime};base64,`);
    }
    return str;
};

// Helper: call wuzapi with automatic header injection
const wuzCall = (method, path, data, headers = {}) => {
    // Auto-normalize media payloads based on Wuzapi Spec
    if (data) {
        // Documents MUST be application/octet-stream
        if (data.Document) data.Document = normalizeBase64(data.Document, 'application/octet-stream');

        // Image/Audio/Video usually come with correct mimes from the browser/frontend.
        // We no longer force octet-stream on them to avoid Wuzapi rejecting specific mimes.
    }
    return wuzapi({ method, url: path, data, headers });
};

// ──────────────────────────────────────────────────────────────
// IN-MEMORY CACHE — avoids hammering Wuzapi on every request
// ──────────────────────────────────────────────────────────────
const CACHE_TTL_MS = 8000; // 8 s
const cache = new Map();

function getCached(key) {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > CACHE_TTL_MS) { cache.delete(key); return null; }
    return entry.value;
}
function setCached(key, value) { cache.set(key, { value, ts: Date.now() }); }

// Fetch Wuzapi admin/users list with caching (shared across all requests)
async function getWuzapiUsers() {
    const cached = getCached('wuzapi_users');
    if (cached) return cached;
    try {
        const r = await wuzapi.get('/admin/users', { headers: { Authorization: process.env.WUZAPI_ADMIN_TOKEN }, timeout: 6000 });
        const users = (r.data?.success && Array.isArray(r.data.data)) ? r.data.data : [];
        setCached('wuzapi_users', users);
        return users;
    } catch {
        return [];
    }
}

// ──────────────────────────────────────────────────────────────
// PHONE VALIDATION — /user/check cache (5 min per number)
// ──────────────────────────────────────────────────────────────
const PHONE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const phoneCache = new Map();

/**
 * Returns { valid: bool, jid: string|null }
 * Caches the result for 5 minutes so campaigns don't hammer Wuzapi.
 */
async function checkPhoneOnWhatsApp(instanceToken, phone) {
    // Normalize: strip +, spaces, dashes
    const normalized = String(phone).replace(/[^0-9]/g, '');
    const cacheKey = `${instanceToken}:${normalized}`;

    const hit = phoneCache.get(cacheKey);
    if (hit && Date.now() - hit.ts < PHONE_CACHE_TTL) return hit.result;

    try {
        const r = await wuzCall('POST', '/user/check', { Phone: [normalized] }, { token: instanceToken });
        const users = r.data?.data?.Users || [];
        const user = users.find(u => u.Query === normalized || u.Query === phone);
        const result = {
            valid: user?.IsInWhatsapp === true,
            jid: user?.JID || null,
            verifiedName: user?.VerifiedName || null,
        };
        phoneCache.set(cacheKey, { result, ts: Date.now() });
        return result;
    } catch {
        // On check failure, allow the send anyway (fail-open)
        return { valid: true, jid: null, verifiedName: null };
    }
}

// ──────────────────────────────────────────────────────────────
// SUPABASE — admin client (service role for server-side ops)
// ──────────────────────────────────────────────────────────────
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
});

// Per-user client (respects RLS with user JWT)
const getSupabaseForUser = (token) =>
    createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
    });

// ──────────────────────────────────────────────────────────────
// EXPRESS APP
// ──────────────────────────────────────────────────────────────
const app = express();
app.set('trust proxy', true);
const PORT = process.env.PORT || 3003;

// Security & perf middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compress());
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }));
app.use(express.json({ limit: '10mb' }));    // 10 MB for base64 media
app.use(morgan('tiny'));

// Logging middleware for debug
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

// Global rate limit: 120 req/min per IP
app.use(rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
    message: { error: 'Muitas requisições. Tente novamente em 1 minuto.' },
}));

// ──────────────────────────────────────────────────────────────
// AUTH MIDDLEWARE
// ──────────────────────────────────────────────────────────────
const authenticateToken = async (req, res, next) => {
    const token = (req.headers['authorization'] || '').split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token não fornecido' });
    try {
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        if (error || !user) throw error || new Error('Usuário não encontrado');
        req.user = user;
        req.token = token;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Token inválido', details: err?.message });
    }
};

// ──────────────────────────────────────────────────────────────
// HEALTH
// ──────────────────────────────────────────────────────────────
app.get('/api/debug-routes', (_req, res) => {
    try {
        const routes = [];
        app._router.stack.forEach(middleware => {
            if (middleware.route) { // routes registered directly on the app
                routes.push({
                    path: middleware.route.path,
                    methods: Object.keys(middleware.route.methods)
                });
            } else if (middleware.name === 'router') { // router middleware 
                middleware.handle.stack.forEach(handler => {
                    if (handler.route) {
                        routes.push({
                            path: handler.route.path,
                            methods: Object.keys(handler.route.methods)
                        });
                    }
                });
            }
        });
        res.json(routes);
    } catch (err) {
        console.error('[DEBUG-ROUTES-ERROR]', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/', (_req, res) => res.json({
    status: 'ok',
    message: 'NexusBot API v2.1 — Multi-User Ready',
    worker: process.pid,
    uptime: Math.round(process.uptime()) + 's',
}));

// ──────────────────────────────────────────────────────────────
// INSTANCES
// ──────────────────────────────────────────────────────────────

// GET /api/instances — list with status sync (no cache for debugging)
// DEBUG PUBLICO (REMOVER DEPOIS)
app.get('/api/debug/instances', async (req, res) => {
    try {
        const { data } = await supabaseAdmin.from('instances').select('*');
        const wuzapiUsers = await getWuzapiUsers();
        const debug = data.map(inst => {
            const wu = wuzapiUsers.find(u => u.token === inst.wuzapi_token);
            return {
                id: inst.id,
                name: inst.name,
                user_id: inst.user_id,
                db_status: inst.status,
                wu_found: !!wu,
                wu_connected: wu?.connected,
                wu_loggedIn: wu?.loggedIn,
                calc_isReady: wu?.connected === true && wu?.loggedIn === true,
                inst_token_preview: inst.wuzapi_token?.substring(0, 5)
            };
        });
        res.json({ debug, wuzapi_count: wuzapiUsers.length });
    } catch (e) { res.status(500).send(e.message); }
});

// Endpoint para corrigir instâncias sem user_id — atribui ao usuário logado
app.post('/api/debug/fix-instances-user', authenticateToken, async (req, res) => {
    try {
        const { data: noUserInstances } = await supabaseAdmin
            .from('instances')
            .select('id, name, user_id')
            .is('user_id', null);

        if (!noUserInstances || noUserInstances.length === 0) {
            return res.json({ message: 'Nenhuma instância sem user_id encontrada.', fixed: 0 });
        }

        const { error } = await supabaseAdmin
            .from('instances')
            .update({ user_id: req.user.id })
            .is('user_id', null);

        if (error) throw error;

        res.json({
            message: `${noUserInstances.length} instância(s) corrigida(s) e atribuída(s) ao usuário ${req.user.id}`,
            fixed: noUserInstances.length,
            instances: noUserInstances.map(i => i.name)
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Debug: retorna o user_id do token logado
app.get('/api/debug/me', authenticateToken, (req, res) => {
    res.json({ user_id: req.user.id, email: req.user.email });
});

app.get('/api/instances', authenticateToken, async (req, res) => {
    try {
        const supaUser = getSupabaseForUser(req.token);
        const { data, error } = await supaUser.from('instances').select('*').eq('user_id', req.user.id);
        if (error) throw error;

        const wuzapiUsers = await getWuzapiUsers(); // cached

        // Sync status and fetch avatarUrl in parallel
        const synced = await Promise.all(data.map(async inst => {
            const wu = wuzapiUsers.find(u => u.token === inst.wuzapi_token);

            const isReady = wu?.connected === true && wu?.loggedIn === true;
            const status = isReady ? 'connected' : 'disconnected';
            const phone = wu?.jid ? wu.jid.split(':')[0].split('@')[0] : null;

            if (inst.status !== status) {
                console.log(`[DEBUG-SYNC] Updating DB Status for ${inst.name}: ${inst.status} -> ${status}`);
                supaUser.from('instances').update({ status }).eq('id', inst.id).then(() => { }).catch(() => { });
            }

            // Fetch profile picture from Wuzapi (only if connected and phone known)
            let avatarUrl = null;
            if (isReady && inst.wuzapi_token && phone) {
                try {
                    const r = await wuzapi.post('/user/avatar', { Phone: phone, Preview: false }, {
                        headers: { token: inst.wuzapi_token },
                        timeout: 5000,
                    });
                    avatarUrl = r.data?.data?.url || null;
                } catch {
                    avatarUrl = null;
                }
            }

            return { ...inst, status, phone, avatarUrl };
        }));

        res.json(synced);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// POST /api/instances/:id/ai - toggle AI Agent state
app.post('/api/instances/:id/ai', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { ai_active } = req.body;

        const supaUser = getSupabaseForUser(req.token);

        // Update the instance
        const { data, error } = await supaUser
            .from('instances')
            .update({ ai_active })
            .eq('id', id)
            .eq('user_id', req.user.id)
            .select()
            .single();

        if (error) throw error;

        // --- AUTOMATIC WEBHOOK CONFIGURATION ---
        // If AI is being activated, auto-configure the Wuzapi webhook
        if (ai_active && data && data.wuzapi_token) {
            const webhookUrl = process.env.WEBHOOK_URL;

            if (webhookUrl) {
                const finalUrl = webhookUrl.includes('?')
                    ? `${webhookUrl}&token=${data.wuzapi_token}`
                    : `${webhookUrl}?token=${data.wuzapi_token}`;

                console.log(`[AI-AUTO] Configurando webhook para instância ${id}: ${finalUrl}`);
                try {
                    // Try PUT first with Active: true (WebhookUpdate definition)
                    const payloadUpdate = {
                        webhook: finalUrl,
                        events: ['Message'],
                        Active: true
                    };
                    const resPut = await axios.put(`${process.env.WUZAPI_URL}/webhook`, payloadUpdate, {
                        headers: { token: data.wuzapi_token }
                    });
                    console.log(`[AI-AUTO] Webhook atualizado (PUT) com sucesso para token: ${data.wuzapi_token.substring(0, 5)}...`, resPut.data);
                } catch (ew) {
                    console.error(`[AI-AUTO] Erro no PUT, tentando POST...`, ew.response?.data || ew.message);
                    try {
                        // Fallback to POST (WebhookSet definition)
                        const payloadSet = {
                            webhook: finalUrl,
                            events: ['Message']
                        };
                        const resPost = await axios.post(`${process.env.WUZAPI_URL}/webhook`, payloadSet, {
                            headers: { token: data.wuzapi_token }
                        });
                        console.log(`[AI-AUTO] Webhook configurado (POST) com sucesso para token: ${data.wuzapi_token.substring(0, 5)}...`, resPost.data);
                    } catch (ew2) {
                        console.error(`[AI-AUTO] Erro fatal ao configurar webhook no Wuzapi:`, ew2.response?.data || ew2.message);
                    }
                }
            } else {
                console.warn(`[AI-AUTO] WEBHOOK_URL não configurada no .env ou é placeholder. Pulando auto-configuração.`);
            }
        }

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/instances/:id/prompt - update AI System Prompt
app.post('/api/instances/:id/prompt', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { system_prompt, ai_delay_min, ai_delay_max } = req.body;

        const supaUser = getSupabaseForUser(req.token);

        const updateData = {};
        if (system_prompt !== undefined) updateData.system_prompt = system_prompt;
        if (ai_delay_min !== undefined) updateData.ai_delay_min = ai_delay_min;
        if (ai_delay_max !== undefined) updateData.ai_delay_max = ai_delay_max;

        const { data, error } = await supaUser
            .from('instances')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', req.user.id)
            .select()
            .single();

        if (error) throw error;

        // --- AUTOMATIC MEMORY WIPE IF PROMPT CHANGED ---
        if (system_prompt !== undefined) {
            try {
                const { error: resetErr } = await supabaseAdmin
                    .from('chat_history')
                    .delete()
                    .eq('instance_id', id);
                if (resetErr) {
                    console.error(`[MEMORY] Auto-wipe falhou ao atualizar o prompt da instancia ${id}`, resetErr);
                } else {
                    console.log(`[MEMORY] Histórico limpo automaticamente para a instância ${id} devido à mudança de prompt.`);
                }
            } catch (wErr) {
                console.error('[MEMORY] Erro fatal no wipe do prompt:', wErr.message);
            }
        }

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/instances/:id/memory - manual memory reset
app.delete('/api/instances/:id/memory', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Verify ownership
        const { data: inst, error: instErr } = await supabaseAdmin
            .from('instances')
            .select('id')
            .eq('id', id)
            .eq('user_id', req.user.id)
            .single();

        if (instErr || !inst) {
            return res.status(403).json({ error: 'Acesso negado ou instância não encontrada.' });
        }

        const { error } = await supabaseAdmin
            .from('chat_history')
            .delete()
            .eq('instance_id', id);

        if (error) throw error;

        console.log(`[MEMORY] Histórico limpo MANUALMENTE para a instância ${id}.`);
        res.json({ success: true, message: 'Memória limpa com sucesso' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GLOBAL WEBHOOK - Process Wuzapi Messages
app.post('/api/webhook', async (req, res) => {
    console.log('--- WUZAPI WEBHOOK RECEIVED ---');
    console.log('Body snippet:', JSON.stringify(req.body).substring(0, 500));

    // Immediate response to Wuzapi to avoid timeouts
    res.sendStatus(200);

    try {
        const token = req.query.token || req.headers.token || req.body.token;
        const msgEvent = req.body.event;

        if (!token) {
            console.log(`[WEBHOOK] Sem token na URL ou Headers, ignorando.`);
            return;
        }

        // Wuzapi message events have Info inside event
        if (!msgEvent || !msgEvent.Info) {
            console.log(`[WEBHOOK] Ignorando evento não-Mensagem.`);
            return;
        }

        const info = msgEvent.Info;
        const chat = info.Chat || '';
        const isGroup = info.IsGroup || chat.includes('@g.us');
        const isBroadcast = chat.includes('@broadcast') || chat.includes('@newsletter');
        const fromMe = info.IsFromMe;
        const pushName = info.PushName || 'Lead';

        console.log(`[WEBHOOK] Filtros Iniciais - Chat: ${chat}, isGroup: ${isGroup}, isBroadcast: ${isBroadcast}, fromMe: ${fromMe}`);

        // 3. Filters: No groups, no broadcast, no self-messages
        if (isGroup || isBroadcast || fromMe) {
            console.log(`[WEBHOOK] Mensagem filtrada/bloqueada (Group/Bcast/Me). Saindo.`);
            return;
        }

        const messageObj = msgEvent.Message;
        if (!messageObj) {
            console.log(`[WEBHOOK] msgEvent.Message indefinido. Saindo.`);
            return;
        }

        const bodyText = messageObj.conversation ||
            messageObj.extendedTextMessage?.text ||
            messageObj.imageMessage?.caption ||
            messageObj.videoMessage?.caption || '';

        const isAudio = messageObj.audioMessage || messageObj.pttMessage;
        const isImage = messageObj.imageMessage;

        if (!bodyText && !isAudio && !isImage) {
            console.log(`[WEBHOOK] Mensagem não textual, não áudio e não imagem. Saindo.`);
            return;
        }

        console.log(`[WEBHOOK] Mensagem detectada (Tamanho original: ${bodyText.length} chars, Audio: ${!!isAudio}, Imagem: ${!!isImage}). Buscando instância DB...`);

        // 4. Identify instance by wuzapi_token (sent as 'token' in webhook body by Wuzapi)
        const { data: instance, error } = await supabaseAdmin
            .from('instances')
            .select('*')
            .eq('wuzapi_token', token)
            .single();

        console.log(`[WEBHOOK] DB Query result para token "${token}": Error: ${error ? JSON.stringify(error) : 'null'}, Instance found: ${!!instance}, AI Active: ${instance?.ai_active}`);

        if (error || !instance || !instance.ai_active) {
            console.log(`[WEBHOOK] Instância DB não encontrada ou AI inativa para token: ${token}. Abortando.`);
            return;
        }

        const rawJid = info.SenderAlt || info.Sender || info.Chat || '';
        const remoteJid = rawJid.replace(/@.*$/, ''); // Extract clean phone number

        console.log(`[WEBHOOK] Instância ativada encontrada! ID: ${instance.id}. RemoteJID limpo: ${remoteJid}`);

        const wuzapiBase = process.env.WUZAPI_URL;
        const wuzapiHeaders = { token: token };

        // 5. Build prompt and context
        const body = bodyText;
        const from = remoteJid;
        const systemPrompt = instance.system_prompt || 'Você é um assistente virtual humano e prestativo.';

        // 6. Humanization: Typing status simulation

        // Indicate "composing"
        console.log(`[WEBHOOK] Disparando Wuzapi Typing Presence para ${from}...`);
        try {
            await axios.post(`${wuzapiBase}/chat/presence`, { Phone: from, State: 'composing' }, { headers: wuzapiHeaders });
        } catch (e) { console.error('Error setting typing status:', e.message); }

        // 7. Random Delay
        console.log(`[WEBHOOK] Iniciando delay humano...`);
        const delayMin = instance.ai_delay_min || 2000;
        const delayMax = instance.ai_delay_max || 5000;
        const actualDelay = Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin;
        await new Promise(r => setTimeout(r, actualDelay));

        console.log(`[WEBHOOK] Construindo conversação base do ChatGPT...`);
        // 8. Handle Content (Multimodal & Audio)
        let userMessageContent = bodyText;

        // Audio -> Transcription (Whisper)
        if (isAudio) {
            try {
                // Indicate "recording" status
                await axios.post(`${wuzapiBase}/chat/presence`, { Phone: from, State: 'recording' }, { headers: wuzapiHeaders });

                console.log(`[WEBHOOK] Baixando arquivo de áudio pela API (Wuzapi Decrypt)...`);

                // Call Wuzapi download endpoint
                const downloadRes = await axios.post(`${wuzapiBase}/chat/downloadaudio`, isAudio, {
                    headers: wuzapiHeaders,
                    responseType: 'json'
                });

                let buffer = null;
                const resData = downloadRes.data;

                console.log(`[WEBHOOK] Resposta do DownloadAudio: ${typeof resData === 'object' ? JSON.stringify(resData).substring(0, 150) : 'Tipo não-objeto'}`);

                let b64Data = '';
                if (typeof resData === 'string') {
                    b64Data = resData;
                } else if (resData && typeof resData.data === 'string') {
                    b64Data = resData.data;
                } else if (resData && typeof resData.base64 === 'string') {
                    b64Data = resData.base64;
                } else if (resData && typeof resData.file === 'string') {
                    b64Data = resData.file;
                } else if (resData && resData.data && typeof resData.data.data === 'string') {
                    // Wuzapi often returns { data: { data: "base64..." } }
                    b64Data = resData.data.data;
                } else if (resData && resData.data && typeof resData.data === 'object' && !Array.isArray(resData.data)) {
                    // Just in case there's another nested key
                    const keys = Object.keys(resData.data);
                    if (keys.length > 0 && typeof resData.data[keys[0]] === 'string') {
                        b64Data = resData.data[keys[0]];
                    }
                }

                if (b64Data) {
                    // Remove prefixo data:audio/ogg;base64, se existir
                    if (b64Data.includes('base64,')) {
                        b64Data = b64Data.split('base64,')[1];
                    } else if (b64Data.includes(',')) {
                        b64Data = b64Data.split(',')[1];
                    }
                    buffer = Buffer.from(b64Data, 'base64');
                } else {
                    console.log(`[WEBHOOK] Falha ao extrair base64. ResData completo: ${JSON.stringify(resData).substring(0, 300)}`);
                    // Try ArrayBuffer fallback if we got raw binary
                    const rawDownload = await axios.post(`${wuzapiBase}/chat/downloadaudio`, isAudio, {
                        headers: wuzapiHeaders,
                        responseType: 'arraybuffer'
                    });

                    if (rawDownload.data && rawDownload.data.byteLength > 100) {
                        buffer = Buffer.from(rawDownload.data);
                        console.log(`[WEBHOOK] Fallback para ArrayBuffer funcionou. Tamanho: ${buffer.length}`);
                    }
                }

                if (buffer && buffer.length > 0) {
                    console.log(`[WEBHOOK] Áudio decriptado com sucesso! Tamanho: ${buffer.length} bytes`);
                    // Save to temp file for Whisper (OpenAI requires a file-like object with a name)
                    const tempAudioPath = `./temp_audio_${Date.now()}.ogg`;
                    fs.writeFileSync(tempAudioPath, buffer);

                    console.log(`[WEBHOOK] Enviando áudio temporário para OpenAI Whisper...`);
                    const transcription = await openai.audio.transcriptions.create({
                        file: fs.createReadStream(tempAudioPath),
                        model: 'whisper-1',
                    });

                    userMessageContent = `[Áudio Transcrito]: ${transcription.text}`;
                    console.log(`[WEBHOOK] Áudio transcrito com sucesso: ${userMessageContent}`);

                    // Cleanup
                    fs.unlinkSync(tempAudioPath);
                } else {
                    console.error('[WEBHOOK] Erro: Buffer de áudio baixado está vazio.');
                    userMessageContent = '[Erro: Arquivo de áudio não pode ser lido]';
                }
            } catch (e) {
                console.error('Error transcribing audio:', e.response?.data || e.message);
                userMessageContent = '[Erro ao processar áudio]';
            }
        }

        // --- 8.5 RECOVERING MEMORY & INJECTING AS CONTEXT ---
        let chatContext = [];
        try {
            console.log(`[WEBHOOK] Buscando memória da instância para o número ${remoteJid}...`);
            // Fetch last 15 interactions
            const { data: dbHistory, error: historyErr } = await supabaseAdmin
                .from('chat_history')
                .select('role, content')
                .eq('instance_id', instance.id)
                .eq('remote_jid', remoteJid)
                .order('created_at', { ascending: false })
                .limit(15);

            if (historyErr) {
                console.error(`[WEBHOOK] Erro ao buscar memória do banco:`, historyErr);
            } else if (dbHistory && dbHistory.length > 0) {
                // Reverse to chronological order for OpenAI
                chatContext = dbHistory.reverse().map(h => ({ role: h.role, content: h.content }));
                console.log(`[WEBHOOK] Memória carregada com sucesso! (${chatContext.length} mensagens anteriores)`);
            }
        } catch (e) {
            console.error(`[WEBHOOK] Exception ao buscar memória:`, e.message);
        }

        const messages = [
            { role: 'system', content: `${systemPrompt}\nNome do lead: ${pushName}` },
            ...chatContext,
            { role: 'user', content: userMessageContent }
        ];

        // --- 8.6 SAVE USER MESSAGE TO MEMORY DB ---
        try {
            await supabaseAdmin.from('chat_history').insert({
                instance_id: instance.id,
                remote_jid: remoteJid,
                role: 'user',
                content: userMessageContent
            });
            console.log(`[WEBHOOK] Mensagem do usuário salva no banco de memórias.`);
        } catch (e) {
            console.error(`[WEBHOOK] Erro ao salvar mensagem do usúario no db:`, e.message);
        }

        // Image -> Multimodal
        if (isImage) {
            messages[1].content = [
                { type: 'text', text: userMessageContent || 'O que você acha desta imagem?' },
                { type: 'image_url', image_url: { url: isImage.url || '' } }
            ];
        }

        // 9. Call OpenAI GPT-4o-mini
        console.log(`[WEBHOOK] Disparando OpenAI para gerar resposta...`);
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: messages,
            max_tokens: 500
        });

        const aiResponse = completion.choices[0].message.content;
        console.log(`[WEBHOOK] OpenAI Resposta Txt: ${aiResponse.substring(0, 30)}... Enviando Zap...`);

        // --- 10. SAVE AI ASSISTANT MESSAGE TO MEMORY DB ---
        try {
            await supabaseAdmin.from('chat_history').insert({
                instance_id: instance.id,
                remote_jid: remoteJid,
                role: 'assistant',
                content: aiResponse
            });
            console.log(`[WEBHOOK] Resposta da IA salva no banco de memórias.`);
        } catch (e) {
            console.error(`[WEBHOOK] Erro ao salvar resposta da IA no db:`, e.message);
        }

        // 11. Send response back via Wuzapi
        const sendResponse = await axios.post(`${wuzapiBase}/chat/send/text`, {
            Phone: from,
            Body: aiResponse
        }, { headers: wuzapiHeaders });

        console.log(`[WEBHOOK] Mensagem de envio Zap Concluída (Status: ${sendResponse.status}). Desativando Presence...`);

        // Indicate "paused"
        try {
            await axios.post(`${wuzapiBase}/chat/presence`, { Phone: from, State: 'paused' }, { headers: wuzapiHeaders });
        } catch (e) { }

    } catch (err) {
        console.error('Webhook processing Error:', err.message);
    }
});

// POST /api/instances — create
app.post('/api/instances', authenticateToken, async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
    try {
        const token = `tok_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
        const r = await wuzapi.post('/admin/users', { name, token }, {
            headers: { Authorization: process.env.WUZAPI_ADMIN_TOKEN },
        });
        const wu = r.data?.data;
        if (!wu?.id) return res.status(500).json({ error: 'Wuzapi falhou ao criar instância', details: r.data });

        cache.delete('wuzapi_users'); // invalidate cache

        const supaUser = getSupabaseForUser(req.token);
        const { data, error } = await supaUser.from('instances').insert([{
            name, user_id: req.user.id, status: 'disconnected',
            wuzapi_id: wu.id, wuzapi_token: wu.token,
        }]).select('*');

        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: 'Falha ao criar instância', details: err.response?.data || err.message });
    }
});

// DELETE /api/instances/:id — remove from Wuzapi + DB
app.delete('/api/instances/:id', authenticateToken, async (req, res) => {
    try {
        const supaUser = getSupabaseForUser(req.token);
        const { data: inst, error } = await supaUser.from('instances').select('*').eq('id', req.params.id).single();
        if (error || !inst) return res.status(404).json({ error: 'Instância não encontrada' });

        console.log(`[DELETE] Removendo instância: ${inst.name} (${inst.wuzapi_id})`);

        // Tenta deslogar antes de deletar (ajuda a limpar arquivos de sessão no Wuzapi)
        wuzapi.post('/chat/logout', {}, {
            headers: { token: inst.wuzapi_token }
        }).catch(() => { });

        // Wuzapi full delete (espera um pouco para o logout processar)
        setTimeout(() => {
            wuzapi.delete(`/admin/users/${inst.wuzapi_id}/full`, {
                headers: { Authorization: process.env.WUZAPI_ADMIN_TOKEN },
            }).catch(e => console.warn('[DELETE wuzapi] Erro:', e.message));
        }, 1000);

        cache.delete('wuzapi_users');

        const { data: del, error: delErr } = await supaUser.from('instances').delete().eq('id', req.params.id).select();
        if (delErr) return res.status(500).json({ error: delErr.message });

        res.json({ success: true, deleted: del?.length || 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ──────────────────────────────────────────────────────────────
// SESSION — QR, Status, Logout, Pair
// ──────────────────────────────────────────────────────────────

// Shared: resolve instance from DB
async function resolveInstance(supaUser, id) {
    const { data, error } = await supaUser.from('instances').select('*').eq('id', id).single();
    if (error || !data) throw Object.assign(new Error('Instância não encontrada'), { statusCode: 404 });
    return data;
}

// GET /api/instances/:id/status
app.get('/api/instances/:id/status', authenticateToken, async (req, res) => {
    try {
        const supaUser = getSupabaseForUser(req.token);
        const inst = await resolveInstance(supaUser, req.params.id);

        const wuzapiUsers = await getWuzapiUsers();
        const wu = wuzapiUsers.find(u => u.token === inst.wuzapi_token);

        // Status real = conectado (socket) + loggedIn (auth)
        const connected = wu?.connected === true;
        const loggedIn = wu?.loggedIn === true;
        const isReady = connected && loggedIn;

        const phone = wu?.jid ? wu.jid.split(':')[0].split('@')[0] : null;
        const status = isReady ? 'connected' : 'disconnected';

        if (inst.status !== status) {
            supaUser.from('instances').update({ status }).eq('id', inst.id).then(() => { }).catch(() => { });
        }

        console.log(`[STATUS] inst=${inst.id} connected=${connected} loggedIn=${loggedIn} status=${status}`);
        res.json({ status_mapped: status, connected, loggedIn, phone, data: wu || {} });
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
});

// GET /api/instances/:id/qr
app.get('/api/instances/:id/qr', authenticateToken, async (req, res) => {
    try {
        const supaUser = getSupabaseForUser(req.token);
        const inst = await resolveInstance(supaUser, req.params.id);

        // Check if already logged in (use cache)
        const wuzapiUsers = await getWuzapiUsers();
        const wu = wuzapiUsers.find(u => u.token === inst.wuzapi_token);

        // Se já estiver logado (e não apenas conectado no socket), pula o QR
        if (wu?.connected === true && wu?.loggedIn === true) return res.json({ connected: true });

        // Connect session then fetch QR
        await wuzCall('POST', '/session/connect', { Immediate: false }, { token: inst.wuzapi_token }).catch(() => { });
        const qrRes = await wuzCall('GET', '/session/qr', null, { token: inst.wuzapi_token });
        res.json(qrRes.data);
    } catch (err) {
        res.status(500).json({ error: 'Falha ao buscar QR Code', details: err.response?.data || err.message });
    }
});

// POST /api/instances/:id/logout
app.post('/api/instances/:id/logout', authenticateToken, async (req, res) => {
    try {
        const supaUser = getSupabaseForUser(req.token);
        const inst = await resolveInstance(supaUser, req.params.id);
        await wuzCall('POST', '/session/logout', {}, { token: inst.wuzapi_token });
        cache.delete('wuzapi_users');
        res.json({ message: 'Sessão encerrada' });
    } catch (err) {
        res.status(500).json({ error: 'Falha ao encerrar sessão', details: err.response?.data || err.message });
    }
});

// POST /api/instances/:id/pair
app.post('/api/instances/:id/pair', authenticateToken, async (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Telefone é obrigatório' });
    try {
        const supaUser = getSupabaseForUser(req.token);
        const inst = await resolveInstance(supaUser, req.params.id);
        await wuzCall('POST', '/session/connect', {}, { token: inst.wuzapi_token }).catch(() => { });
        const r = await wuzCall('POST', '/session/pairphone', { Phone: phone }, { token: inst.wuzapi_token });
        res.json(r.data);
    } catch (err) {
        res.status(500).json({ error: 'Falha ao gerar código de pareamento', details: err.response?.data || err.message });
    }
});

// ──────────────────────────────────────────────────────────────
// AVATAR
// ──────────────────────────────────────────────────────────────
app.get('/api/instances/:id/avatar', authenticateToken, async (req, res) => {
    try {
        const supaUser = getSupabaseForUser(req.token);
        const inst = await resolveInstance(supaUser, req.params.id);

        const wuzapiUsers = await getWuzapiUsers();
        const wu = wuzapiUsers.find(u => u.token === inst.wuzapi_token);
        if (!wu?.jid) return res.json({ url: null, phone: null });

        const phone = wu.jid.split('@')[0].split(':')[0];
        const r = await wuzCall('POST', '/user/avatar', { Phone: phone, Preview: true }, { token: inst.wuzapi_token });
        res.json({ url: r.data?.URL || null, phone });
    } catch {
        res.json({ url: null, phone: null });
    }
});

// ──────────────────────────────────────────────────────────────
// MESSAGE DISPATCH — /api/instances/:id/send/*
// All endpoints proxy to Wuzapi with the instance token
// ──────────────────────────────────────────────────────────────
function makeProxyHandler(wuzapiPath, { validatePhone = false } = {}) {
    return async (req, res) => {
        try {
            const supaUser = getSupabaseForUser(req.token);
            const inst = await resolveInstance(supaUser, req.params.id);

            // ── Validação do número antes do envio ──────────────────
            let targetPhone = req.body?.Phone;
            if (validatePhone) {
                if (!targetPhone) return res.status(400).json({ error: 'Campo Phone é obrigatório' });

                const check = await checkPhoneOnWhatsApp(inst.wuzapi_token, targetPhone);
                console.log(`[CHECK] Phone ${targetPhone} result:`, JSON.stringify(check));
                if (!check.valid) {
                    return res.status(422).json({
                        error: 'Número não está no WhatsApp',
                        phone: targetPhone,
                        isInWhatsapp: false,
                    });
                }

                // Se temos um JID canônico, usamos ele (resolve o problema do 9º dígito)
                if (check.jid) {
                    const canonical = check.jid.split('@')[0];
                    if (canonical !== targetPhone) {
                        console.log(`[SEND] Canonicalizing number: ${targetPhone} -> ${canonical}`);
                        targetPhone = canonical;
                        req.body.Phone = canonical;
                    }
                }
            }

            // ── Log de debug ────────────────────────────────────────
            const fullWuzUrl = `${process.env.WUZAPI_URL}${wuzapiPath}`;
            console.log(`[SEND] Calling Wuzapi: ${fullWuzUrl} | Phone: ${targetPhone}`);
            console.log(`[SEND] Payload: ${JSON.stringify(req.body).slice(0, 500)}`);

            const r = await wuzCall('POST', wuzapiPath, req.body, { token: inst.wuzapi_token });

            console.log(`[SEND] Wuzapi Success! Code: ${r.data?.code} | Message: ${r.data?.message || 'OK'}`);
            if (r.data?.data) console.log(`[SEND] Response Data: ${JSON.stringify(r.data.data).slice(0, 200)}`);

            res.json(r.data);
        } catch (err) {
            const errorData = err.response?.data || err.message;
            console.error(`[SEND] FATAL ERROR ${wuzapiPath}:`, JSON.stringify(errorData, null, 2));
            res.status(500).json({ error: 'Falha ao enviar mensagem', details: errorData });
        }
    };
}

// validatePhone: true → chama /user/check antes de enviar
app.post('/api/instances/:id/send/text', authenticateToken, makeProxyHandler('/chat/send/text', { validatePhone: true }));
app.post('/api/instances/:id/send/image', authenticateToken, makeProxyHandler('/chat/send/image', { validatePhone: true }));
app.post('/api/instances/:id/send/audio', authenticateToken, makeProxyHandler('/chat/send/audio', { validatePhone: true }));
app.post('/api/instances/:id/send/video', authenticateToken, makeProxyHandler('/chat/send/video', { validatePhone: true }));
app.post('/api/instances/:id/send/document', authenticateToken, makeProxyHandler('/chat/send/document', { validatePhone: true }));
app.post('/api/instances/:id/send/sticker', authenticateToken, makeProxyHandler('/chat/send/sticker', { validatePhone: true }));
app.post('/api/instances/:id/send/location', authenticateToken, makeProxyHandler('/chat/send/location', { validatePhone: true }));
app.post('/api/instances/:id/send/contact', authenticateToken, makeProxyHandler('/chat/send/contact', { validatePhone: true }));
app.post('/api/instances/:id/send/buttons', authenticateToken, makeProxyHandler('/chat/send/buttons', { validatePhone: true }));
app.post('/api/instances/:id/send/list', authenticateToken, makeProxyHandler('/chat/send/list', { validatePhone: true }));
app.post('/api/instances/:id/send/poll', authenticateToken, makeProxyHandler('/chat/send/poll', { validatePhone: false })); // poll usa Group, não Phone
app.post('/api/instances/:id/send/template', authenticateToken, makeProxyHandler('/chat/send/template', { validatePhone: true }));

// ── Endpoint dedicado para verificar número avulso ─────────────────
app.post('/api/instances/:id/check', authenticateToken, async (req, res) => {
    const { phones } = req.body; // array de números
    if (!phones || !Array.isArray(phones) || phones.length === 0)
        return res.status(400).json({ error: 'Forneça um array "phones"' });
    try {
        const supaUser = getSupabaseForUser(req.token);
        const inst = await resolveInstance(supaUser, req.params.id);
        const r = await wuzCall('POST', '/user/check', { Phone: phones }, { token: inst.wuzapi_token });
        res.json(r.data);
    } catch (err) {
        res.status(500).json({ error: 'Falha ao verificar números', details: err.response?.data || err.message });
    }
});

// ──────────────────────────────────────────────────────────────
// USER INFO (Wuzapi /user/*)
// ──────────────────────────────────────────────────────────────
app.post('/api/instances/:id/user/check', authenticateToken, makeProxyHandler('/user/check'));
app.post('/api/instances/:id/user/info', authenticateToken, makeProxyHandler('/user/info'));
app.get('/api/instances/:id/user/contacts', authenticateToken, async (req, res) => {
    try {
        const supaUser = getSupabaseForUser(req.token);
        const inst = await resolveInstance(supaUser, req.params.id);
        const r = await wuzCall('GET', '/user/contacts', null, { token: inst.wuzapi_token });
        res.json(r.data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ──────────────────────────────────────────────────────────────
// GROUP ENDPOINTS (Wuzapi /group/*)
// ──────────────────────────────────────────────────────────────
function makeGroupProxy(method, path) {
    return async (req, res) => {
        try {
            const supaUser = getSupabaseForUser(req.token);
            const inst = await resolveInstance(supaUser, req.params.id);
            const r = await wuzCall(method, path, method !== 'GET' ? req.body : null, { token: inst.wuzapi_token });
            res.json(r.data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    };
}

app.get('/api/instances/:id/groups', authenticateToken, makeGroupProxy('GET', '/group/list'));
app.post('/api/instances/:id/group/create', authenticateToken, makeGroupProxy('POST', '/group/create'));
app.post('/api/instances/:id/group/participants', authenticateToken, makeGroupProxy('POST', '/group/updateparticipants'));
app.post('/api/instances/:id/group/leave', authenticateToken, makeGroupProxy('POST', '/group/leave'));
app.post('/api/instances/:id/group/name', authenticateToken, makeGroupProxy('POST', '/group/name'));
app.post('/api/instances/:id/group/topic', authenticateToken, makeGroupProxy('POST', '/group/topic'));
app.post('/api/instances/:id/group/photo', authenticateToken, makeGroupProxy('POST', '/group/photo'));
app.post('/api/instances/:id/group/join', authenticateToken, makeGroupProxy('POST', '/group/join'));
app.post('/api/instances/:id/group/announce', authenticateToken, makeGroupProxy('POST', '/group/announce'));

// ──────────────────────────────────────────────────────────────
// CAMPAIGNS (Scheduling)
// ──────────────────────────────────────────────────────────────
app.get('/api/campaigns', authenticateToken, async (req, res) => {
    console.log('[DEBUG] GET /api/campaigns for user:', req.user?.email);
    try {
        const { data: campaigns, error } = await supabaseAdmin
            .from('campaigns')
            .select('*, instance:instances(name, wuzapi_token)')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const wuzapiUsers = await getWuzapiUsers();

        // Flatten instance name and get phone
        const formatted = campaigns.map(c => {
            const token = c.instance?.wuzapi_token;
            const wu = wuzapiUsers.find(u => u.token === token);
            const phone = wu?.jid ? wu.jid.split(':')[0].split('@')[0] : null;

            return {
                ...c,
                instance_name: c.instance?.name || 'Desconhecida',
                instance_phone: phone || 'Desconhecido'
            };
        });

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/campaigns/:id/logs', authenticateToken, async (req, res) => {
    try {
        const { data: campaign, error } = await supabaseAdmin
            .from('campaigns')
            .select('name, results, scheduled_at')
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .single();

        if (error || !campaign) {
            return res.status(404).json({ error: 'Campanha não encontrada' });
        }

        res.json({
            name: campaign.name,
            scheduled_at: campaign.scheduled_at,
            results: campaign.results || []
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/campaigns', authenticateToken, async (req, res) => {
    console.log('[DEBUG] Received POST /api/campaigns from user:', req.user?.email);
    try {
        const {
            name,
            instance_id,
            scheduled_at,
            contacts,
            messages,
            media_type,
            file_base64,
            file_caption,
            interval_base,
            randomization,
            total_contacts
        } = req.body;

        if (!name || !instance_id || !scheduled_at || !contacts) {
            return res.status(400).json({ error: 'Campos obrigatórios: name, instance_id, scheduled_at, contacts' });
        }

        const { data, error } = await supabaseAdmin
            .from('campaigns')
            .insert([{
                user_id: req.user.id,
                instance_id,
                name,
                status: 'scheduled', // O worker pegará tanto imediatos (com data <= agora) quanto futuros
                scheduled_at,
                contacts,
                messages,
                media_type: media_type || 'text',
                file_base64,
                file_caption,
                interval_base: interval_base || 5,
                randomization: randomization || 30,
                total_contacts: total_contacts || contacts.length,
                current_index: 0
            }])
            .select()
            .single();

        if (error) {
            console.error('[CAMPAIGN] Supabase Error:', JSON.stringify(error, null, 2));
            throw error;
        }

        console.log(`[CAMPAIGN] Created: ${name}`);
        res.json({ success: true, campaign: data });
    } catch (err) {
        console.error('[CAMPAIGN] Catch Error:', err.message);
        res.status(500).json({ error: 'Erro ao processar campanha', details: err.message });
    }
});

// POST /api/campaigns/:id/cancel
app.post('/api/campaigns/:id/cancel', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('campaigns')
            .update({ status: 'completed', updated_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .select();

        if (error) throw error;
        res.json({ success: true, message: 'Campanha cancelada com sucesso' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/campaigns/:id
app.delete('/api/campaigns/:id', authenticateToken, async (req, res) => {
    try {
        const { error } = await supabaseAdmin
            .from('campaigns')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', req.user.id);

        if (error) throw error;
        res.json({ success: true, message: 'Campanha excluída com sucesso' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ──────────────────────────────────────────────────────────────
app.post('/api/webhook', async (req, res) => {
    const payload = req.body;
    // Process async without blocking the ACK — Wuzapi expects fast 200
    setImmediate(() => {
        // TODO: dispatch to user's configured webhook or AI pipeline
        console.log('[WEBHOOK]', JSON.stringify(payload).substring(0, 200));
    });
    res.status(200).send('OK');
});

// ──────────────────────────────────────────────────────────────
// GLOBAL ERROR HANDLER
// ──────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error('[ERROR]', err.message);
    res.status(500).json({ error: 'Erro interno do servidor', details: err.message });
});

// ──────────────────────────────────────────────────────────────
// START
// ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`[WORKER ${process.pid}] NexusBot API v2.0 rodando na porta ${PORT}`);

    // Inicia worker de campanhas (verifica a cada 60s)
    setInterval(() => processCampaigns(supabaseAdmin, { wuzCall, checkPhoneOnWhatsApp }), 60000);
});

module.exports = {
    wuzCall,
    checkPhoneOnWhatsApp,
    getWuzapiUsers
};
