# Guia do Sistema de Handover & Rodízio Inteligente 🤝

O sistema agora é capaz de detectar automaticamente quando um cliente quer falar com um humano, pausar a IA e notificar o atendente correto (ou você).

## 1. Como a IA detecta a intenção? 🧠
Além das palavras-chave manuais, a IA foi instruída com um comando oculto:
> "Se o cliente quiser falar com suporte, atendente ou humano, responda apenas: **[HANDOVER]**"

Quando o servidor vê esse código interno, ele interrompe a conversa da IA imediatamente e inicia a transferência.

## 2. Lógica de Notificação (Quem recebe?) 📞
O fluxo segue esta prioridade:

1.  **Gatilho Ativado:** O cliente diz "preciso de ajuda" ou a IA detecta a intenção.
2.  **Pausa da IA:** O contato é bloqueado para a IA (você pode ver isso na aba "Leads").
3.  **Seleção do Destino:**
    - **Se Rodízio (Round-Robin) estiver LIGADO:** O sistema busca o atendente que está há mais tempo sem receber um lead.
    - **Se Rodízio estiver DESLIGADO ou não houver atendentes:** O sistema envia a notificação diretamente para o seu **Telefone Admin**.
4.  **Resumo:** A IA gera um resumo rápido das últimas mensagens para que o atendente já saiba do que se trata o assunto.

## 3. Normalização de Números (O "Pulo do Gato" para o DDD 91) 🇧🇷
Descobrimos que o WhatsApp às vezes exige 12 dígitos (sem o 9) e às vezes 13 (com o 9).
- Criei uma função que limpa os números automaticamente.
- Para DDDs como o seu (**91**), o sistema remove o "9" redundante antes de enviar a notificação via Wuzapi. Isso garante que a mensagem **realmente chegue** ao seu celular.

## 4. O Que Mudou na Interface? 🖥️
![Interface de Configuração](file:///C:/Users/inoov/.gemini/antigravity/brain/970cd86c-b3ec-4cc1-b094-7dafdc5083b8/media__1772569980726.png)

- **Botão Rodízio Ativo:** Escolha entre usar a fila de funcionários ou receber tudo sozinho.
- **Badge "Na Vez":** Mostra em tempo real quem é o próximo atendente que será notificado.
- **Lista de Atendentes:** Adicione ou remova pessoas da fila de forma simples.

---
### Dica de Ouro:
Para testar, envie uma mensagem natural como *"pode me passar para um atendente?"*. O sistema deve te responder confirmando a transferência e você deve receber o alerta no Zap segundos depois!
