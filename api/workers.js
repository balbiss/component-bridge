const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Trava local para evitar que o mesmo processo processe a mesma campanha em paralelo
const activeCampaigns = new Set();

function applyTemplate(text, name) {
    return text.replace(/\{\{nome\}\}/gi, name || 'Amigo(a)');
}

async function processCampaigns(supabase, helpers) {
    const { wuzCall, checkPhoneOnWhatsApp } = helpers;

    try {
        const now = new Date();
        const staleThreshold = new Date(now.getTime() - 5 * 60 * 1000).toISOString(); // 5 minutos atrás

        // 1. Busca campanhas que precisam de atenção:
        // - 'scheduled' com data de agendamento passada
        // - 'running' que não foram atualizadas há mais de 5 minutos (indicativo de queda do servidor)
        const { data: campaigns, error } = await supabase
            .from('campaigns')
            .select('*, instance:instances(*)')
            .or(`status.eq.scheduled,and(status.eq.running,updated_at.lt.${staleThreshold})`)
            .lte('scheduled_at', now.toISOString());

        if (error) throw error;
        if (!campaigns || campaigns.length === 0) return;

        // Filtra as que já estão sendo processadas por este worker específico
        const toProcess = campaigns.filter(c => !activeCampaigns.has(c.id));
        if (toProcess.length === 0) return;

        console.log(`[WORKER] Encontradas ${toProcess.length} campanhas elegíveis.`);

        for (const campaign of toProcess) {
            // Adiciona à trava local
            activeCampaigns.add(campaign.id);

            try {
                // Marca como rodando e atualiza o timestamp para mostrar sinal de vida
                const { error: upErr } = await supabase
                    .from('campaigns')
                    .update({
                        status: 'running',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', campaign.id);

                if (upErr) throw upErr;

                console.log(`[WORKER] Iniciando/Retomando campanha: ${campaign.name} (${campaign.id})`);

                const instance = campaign.instance;
                if (!instance || !instance.wuzapi_token) throw new Error('Instância inválida');

                const contacts = campaign.contacts || [];
                const messages = campaign.messages || [];
                const mediaType = campaign.media_type || 'text';
                const token = instance.wuzapi_token;

                // Resume de onde parou
                const startIndex = campaign.current_index || 0;
                let results = Array.isArray(campaign.results) ? campaign.results : [];

                // Se o current_index exceder o número de contatos, finaliza logo
                if (startIndex >= contacts.length) {
                    await supabase.from('campaigns').update({ status: 'completed' }).eq('id', campaign.id);
                    continue;
                }

                for (let i = startIndex; i < contacts.length; i++) {
                    // Check POINT: Antes de cada envio, verifica se houve intervenção externa (Pause/Cancel)
                    const { data: check, error: checkErr } = await supabase
                        .from('campaigns')
                        .select('status')
                        .eq('id', campaign.id)
                        .single();

                    if (checkErr || !check || check.status !== 'running') {
                        console.log(`[WORKER] Campanha ${campaign.id} interrompida. Status atual: ${check?.status || 'desconhecido'}`);
                        break;
                    }

                    const contact = contacts[i];
                    const msgTemplate = messages[i % messages.length] || '';
                    const body = applyTemplate(msgTemplate, contact.name);
                    let targetPhone = String(contact.phone).replace(/[^0-9]/g, '');

                    let status = 'error';
                    let errorMsg = '';

                    try {
                        // Canonicalização do número
                        const checkWuz = await checkPhoneOnWhatsApp(token, targetPhone);
                        if (checkWuz.jid) targetPhone = checkWuz.jid.split('@')[0];

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

                        console.log(`[WORKER] Sending to ${targetPhone} | Camp: ${campaign.id}`);
                        const r = await wuzCall('POST', endpoint, payload, { token });

                        if (r.data?.success === false) throw new Error(r.data?.message || 'Wuzapi error');
                        status = 'success';
                    } catch (err) {
                        errorMsg = err.response?.data?.message || err.message;
                        console.error(`[WORKER] Erro em ${targetPhone}:`, errorMsg);
                        status = 'error';
                    }

                    results.push({ phone: targetPhone, status, error: errorMsg, ts: new Date().toISOString() });

                    // Persiste progresso a cada envio para garantir retomada precisa
                    await supabase.from('campaigns').update({
                        current_index: i + 1,
                        results,
                        updated_at: new Date().toISOString()
                    }).eq('id', campaign.id);

                    // Delay humanoide
                    const delay = (campaign.interval_base + Math.random() * campaign.randomization) * 1000;
                    await sleep(delay);
                }

                // Verifica se terminou todos os contatos com sucesso ou se saiu por interrupção
                const { data: finalCheck } = await supabase.from('campaigns').select('status, current_index').eq('id', campaign.id).single();
                if (finalCheck && finalCheck.status === 'running' && finalCheck.current_index >= contacts.length) {
                    await supabase.from('campaigns').update({
                        status: 'completed',
                        updated_at: new Date().toISOString()
                    }).eq('id', campaign.id);
                    console.log(`[WORKER] Campanha ${campaign.name} finalizada com sucesso.`);
                }

            } catch (campErr) {
                console.error(`[WORKER] Erro grave na campanha ${campaign.id}:`, campErr.message);
                await supabase.from('campaigns').update({ status: 'error', error_log: campErr.message }).eq('id', campaign.id);
            } finally {
                // Libera a trava local
                activeCampaigns.delete(campaign.id);
            }
        }
    } catch (err) {
        console.error('[WORKER] Loop principal falhou:', err.message);
    }
}

module.exports = { processCampaigns };
