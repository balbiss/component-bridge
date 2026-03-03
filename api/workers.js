const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function applyTemplate(text, name) {
    return text.replace(/\{\{nome\}\}/gi, name || 'Amigo(a)');
}

async function processCampaigns(supabase, helpers) {
    const { wuzCall, checkPhoneOnWhatsApp } = helpers;

    try {
        // 1. Busca campanhas agendadas ou em execução (para retomada)
        const now = new Date().toISOString();
        const { data: campaigns, error } = await supabase
            .from('campaigns')
            .select('*, instance:instances(*)')
            .or(`status.eq.scheduled,status.eq.running`)
            .lte('scheduled_at', now);

        if (error) throw error;
        if (!campaigns || campaigns.length === 0) return;

        console.log(`[WORKER] Encontradas ${campaigns.length} campanhas para processar.`);

        for (const campaign of campaigns) {
            try {
                // Se já estiver 'running', pode ser uma retomada após queda do servidor
                if (campaign.status === 'running') {
                    console.log(`[WORKER] Retomando campanha interrompida: ${campaign.name} (${campaign.id}) — do índice ${campaign.current_index || 0}`);
                } else {
                    // Marca como rodando para evitar que outros processos peguem
                    const { error: upErr } = await supabase.from('campaigns').update({ status: 'running', updated_at: new Date().toISOString() }).eq('id', campaign.id);
                    if (upErr) throw upErr;
                    console.log(`[WORKER] Iniciando campanha: ${campaign.name} (${campaign.id})`);
                }

                const instance = campaign.instance;
                if (!instance || !instance.wuzapi_token) {
                    throw new Error('Instância não encontrada ou sem token Wuzapi');
                }

                const contacts = campaign.contacts || [];
                const messages = campaign.messages || [];
                const mediaType = campaign.media_type || 'text';
                const token = instance.wuzapi_token;

                const results = [];
                let successCount = 0;
                let errorCount = 0;

                // Inicializa total_contacts se não estiver setado
                if (!campaign.total_contacts) {
                    await supabase.from('campaigns').update({ total_contacts: contacts.length }).eq('id', campaign.id);
                }

                const startIndex = campaign.current_index || 0;
                for (let i = startIndex; i < contacts.length; i++) {
                    const contact = contacts[i];
                    const msgTemplate = messages[i % messages.length] || '';
                    const body = applyTemplate(msgTemplate, contact.name);
                    let targetPhone = String(contact.phone).replace(/[^0-9]/g, '');

                    let status = 'error';
                    let errorMsg = '';

                    try {
                        // ── Validação/JID Canônico (9º dígito) ──────────
                        const check = await checkPhoneOnWhatsApp(token, targetPhone);
                        if (check.jid) {
                            const canonical = check.jid.split('@')[0];
                            if (canonical !== targetPhone) {
                                console.log(`[WORKER] Canonicalizing: ${targetPhone} -> ${canonical}`);
                                targetPhone = canonical;
                            }
                        }

                        // ── Envio ───────────────────────────────────────
                        let payload = { Phone: targetPhone };
                        let endpoint = '';

                        if (mediaType === 'text') {
                            endpoint = '/chat/send/text';
                            payload.Body = body;
                        } else if (mediaType === 'image') {
                            endpoint = '/chat/send/image';
                            payload.Image = campaign.file_base64;
                            payload.Caption = campaign.file_caption || body;
                        } else if (mediaType === 'audio') {
                            endpoint = '/chat/send/audio';
                            payload.Audio = campaign.file_base64;
                        } else if (mediaType === 'video') {
                            endpoint = '/chat/send/video';
                            payload.Video = campaign.file_base64;
                            payload.Caption = campaign.file_caption || body;
                        } else if (mediaType === 'document') {
                            endpoint = '/chat/send/document';
                            payload.Document = campaign.file_base64;
                            payload.FileName = 'arquivo.pdf';
                            payload.Caption = campaign.file_caption || body;
                        }

                        const r = await wuzCall('POST', endpoint, payload, { token });

                        if (r.data?.success === false) {
                            throw new Error(r.data?.message || 'Wuzapi error');
                        }

                        successCount++;
                        status = 'success';
                    } catch (err) {
                        console.error(`[WORKER] Erro ao enviar para ${targetPhone}:`, err.message);
                        errorCount++;
                        errorMsg = err.message;
                        status = 'error';
                    }

                    results.push({ phone: targetPhone, status, error: errorMsg, ts: new Date().toISOString() });

                    // Atualiza progresso periodicamente (ou a cada mensagem se for pequena)
                    // Para dar feedback em tempo real no Dashboard, atualizamos a cada mensagem.
                    // Adicionamos uma verificação: se o status no BD não for mais 'running', paramos (cancelamento)
                    const { data: currentCamp } = await supabase.from('campaigns').select('status').eq('id', campaign.id).single();
                    if (currentCamp && currentCamp.status !== 'running') {
                        console.log(`[WORKER] Campanha ${campaign.id} interrompida externamente (status: ${currentCamp.status})`);
                        return; // Sai do loop da campanha
                    }

                    await supabase.from('campaigns').update({
                        current_index: i + 1,
                        results: results,
                        updated_at: new Date().toISOString()
                    }).eq('id', campaign.id);

                    // Delay entre envios
                    const delay = (campaign.interval_base + Math.random() * campaign.randomization) * 1000;
                    await sleep(delay);
                }

                // Finaliza campanha
                await supabase.from('campaigns').update({
                    status: 'completed',
                    updated_at: new Date().toISOString(),
                    current_index: contacts.length // Garante que está no final
                }).eq('id', campaign.id);

                console.log(`[WORKER] Campanha ${campaign.name} concluída. Sucesso: ${successCount}, Erro: ${errorCount}`);

            } catch (campErr) {
                console.error(`[WORKER] Falha crítica na campanha ${campaign.id}:`, campErr.message);
                await supabase.from('campaigns').update({ status: 'error' }).eq('id', campaign.id);
            }
        }
    } catch (err) {
        console.error('[WORKER] Erro no processamento:', err.message);
    }
}

module.exports = { processCampaigns };
