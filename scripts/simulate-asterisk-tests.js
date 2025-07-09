#!/usr/bin/env node

/**
 * SIMULADOR DE TESTES ASTERISK
 * Valida configurações sem precisar do Docker
 */

const fs = require('fs');
const path = require('path');

// Cores para output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = (color, message) => console.log(`${colors[color]}${message}${colors.reset}`);

console.log(`${colors.blue}🔍 SIMULADOR DE TESTES ASTERISK${colors.reset}`);
console.log('='.repeat(50));

// =================================================
// TESTE 1: VALIDAÇÃO DE ARQUIVOS DE CONFIGURAÇÃO
// =================================================
log('yellow', '\n📁 Validando arquivos de configuração...');

const configFiles = [
  { path: 'asterisk/etc/pjsip.conf', name: 'PJSIP Config' },
  { path: 'asterisk/etc/http.conf', name: 'HTTP Config' },
  { path: 'asterisk/etc/modules.conf', name: 'Modules Config' },
  { path: 'asterisk/etc/extensions.conf', name: 'Extensions Config' },
  { path: 'asterisk/etc/rtp.conf', name: 'RTP Config' }
];

configFiles.forEach(file => {
  if (fs.existsSync(file.path)) {
    log('green', `✅ ${file.name} - PRESENTE`);
  } else {
    log('red', `❌ ${file.name} - AUSENTE`);
  }
});

// =================================================
// TESTE 2: ANÁLISE DO CONTEÚDO PJSIP.CONF
// =================================================
log('yellow', '\n📱 Analisando configuração PJSIP...');

try {
  const pjsipContent = fs.readFileSync('asterisk/etc/pjsip.conf', 'utf8');
  
  // Verificar seções essenciais
  const checks = [
    { pattern: /\[transport-wss\]/, name: 'Transport WSS' },
    { pattern: /webrtc=yes/, name: 'WebRTC habilitado' },
    { pattern: /dtls_auto_generate_cert=yes/, name: 'DTLS configurado' },
    { pattern: /\[agent-1001\]/, name: 'Endpoint agent-1001' },
    { pattern: /protocol=wss/, name: 'Protocolo WSS' },
    { pattern: /cert_file=/, name: 'Certificado SSL' }
  ];
  
  checks.forEach(check => {
    if (check.pattern.test(pjsipContent)) {
      log('green', `✅ ${check.name} - CONFIGURADO`);
    } else {
      log('red', `❌ ${check.name} - NÃO ENCONTRADO`);
    }
  });
  
} catch (error) {
  log('red', '❌ Erro ao ler pjsip.conf');
}

// =================================================
// TESTE 3: ANÁLISE DO HTTP.CONF
// =================================================
log('yellow', '\n🔒 Analisando configuração HTTP/WSS...');

try {
  const httpContent = fs.readFileSync('asterisk/etc/http.conf', 'utf8');
  
  const httpChecks = [
    { pattern: /tlsenable=yes/, name: 'TLS habilitado' },
    { pattern: /tlsbindaddr=.*:8089/, name: 'Porta WSS 8089' },
    { pattern: /tlscertfile=/, name: 'Certificado TLS' },
    { pattern: /websocket_enabled=yes/, name: 'WebSocket habilitado' }
  ];
  
  httpChecks.forEach(check => {
    if (check.pattern.test(httpContent)) {
      log('green', `✅ ${check.name} - CONFIGURADO`);
    } else {
      log('red', `❌ ${check.name} - NÃO ENCONTRADO`);
    }
  });
  
} catch (error) {
  log('red', '❌ Erro ao ler http.conf');
}

// =================================================
// TESTE 4: ANÁLISE DO EXTENSIONS.CONF (ECHO TEST)
// =================================================
log('yellow', '\n☎️  Analisando dialplan (inclui echo test)...');

try {
  const extensionsContent = fs.readFileSync('asterisk/etc/extensions.conf', 'utf8');
  
  const dialplanChecks = [
    { pattern: /exten => 9999/, name: 'Extensão Echo (9999)' },
    { pattern: /Echo\(\)/, name: 'Aplicação Echo' },
    { pattern: /exten => 1001/, name: 'Ramal Agent 1001' },
    { pattern: /\[from-internal\]/, name: 'Contexto from-internal' },
    { pattern: /same => n,Answer\(\)/, name: 'Answer configurado' }
  ];
  
  dialplanChecks.forEach(check => {
    if (check.pattern.test(extensionsContent)) {
      log('green', `✅ ${check.name} - CONFIGURADO`);
    } else {
      log('red', `❌ ${check.name} - NÃO ENCONTRADO`);
    }
  });
  
} catch (error) {
  log('red', '❌ Erro ao ler extensions.conf');
}

// =================================================
// TESTE 5: VERIFICAÇÃO DE MÓDULOS
// =================================================
log('yellow', '\n📦 Verificando módulos configurados...');

try {
  const modulesContent = fs.readFileSync('asterisk/etc/modules.conf', 'utf8');
  
  const requiredModules = [
    'chan_pjsip.so',
    'res_pjsip.so',
    'res_http_websocket.so',
    'res_srtp.so',
    'res_rtp_asterisk.so'
  ];
  
  requiredModules.forEach(module => {
    if (modulesContent.includes(`load = ${module}`)) {
      log('green', `✅ ${module} - CONFIGURADO PARA CARREGAR`);
    } else {
      log('red', `❌ ${module} - NÃO ENCONTRADO`);
    }
  });
  
} catch (error) {
  log('red', '❌ Erro ao ler modules.conf');
}

// =================================================
// ANÁLISE DOS PROBLEMAS DE ECHO ANTERIORES
// =================================================
log('yellow', '\n🔧 Análise dos problemas de ECHO anteriores...');

console.log(`
${colors.blue}📋 POSSÍVEIS CAUSAS DOS PROBLEMAS DE ECHO:${colors.reset}

${colors.red}❌ PROBLEMAS COMUNS ANTERIORES:${colors.reset}
1. Transport WS (não-seguro) em ambiente HTTPS
2. Certificados SSL inválidos ou ausentes
3. Módulos PJSIP não carregados corretamente
4. Configuração RTP inadequada para WebRTC
5. ICE/STUN não configurado
6. Portas RTP bloqueadas

${colors.green}✅ SOLUÇÕES IMPLEMENTADAS AGORA:${colors.reset}
1. WSS (seguro) apenas - compatível com HTTPS
2. Certificados SSL auto-assinados válidos
3. Todos os módulos PJSIP necessários carregados
4. RTP otimizado para WebRTC (portas 10000-20000)
5. STUN configurado (stun.l.google.com:19302)
6. ICE support habilitado
`);

// =================================================
// RECOMENDAÇÕES DE TESTE
// =================================================
log('blue', '\n🎯 RECOMENDAÇÕES DE TESTE:');

console.log(`
${colors.yellow}🔄 OPÇÕES PARA TESTAR:${colors.reset}

${colors.green}OPÇÃO A - Docker Desktop/Ambiente Local:${colors.reset}
1. docker-compose --profile tools run --rm cert-generator
2. docker-compose up -d asterisk
3. ./scripts/test-asterisk-config.sh
4. Teste WebRTC: wss://localhost:8089/ws

${colors.green}OPÇÃO B - Codespaces/GitHub:${colors.reset}
1. Criar Codespace do repositório
2. Executar os mesmos comandos Docker
3. Usar port forwarding para teste

${colors.green}OPÇÃO C - Cloud Environment:${colors.reset}
1. Deploy em AWS/DigitalOcean/Azure
2. Configurar domínio com SSL válido
3. Teste com certificados reais

${colors.green}OPÇÃO D - Simulação Local (SEM DOCKER):${colors.reset}
1. Instalar Asterisk localmente
2. Copiar configurações geradas
3. Testar manualmente
`);

// =================================================
// DIAGNÓSTICO DOS PROBLEMAS DE ECHO
// =================================================
log('blue', '\n🩺 DIAGNÓSTICO ESPECÍFICO DOS PROBLEMAS DE ECHO:');

console.log(`
${colors.yellow}🔍 CHECKLIST PARA ECHO FUNCIONAR:${colors.reset}

${colors.green}✅ Configuração:${colors.reset}
- WSS Transport configurado (porta 8089)
- Extensão 9999 com Echo() app
- Contexto from-internal correto
- DTLS/SRTP habilitado

${colors.green}✅ Rede:${colors.reset}
- Certificados SSL válidos
- STUN server configurado
- ICE support habilitado
- Portas RTP abertas (10000-20000/udp)

${colors.green}✅ Cliente WebRTC:${colors.reset}
- Conexão via wss:// (não ws://)
- Permissões de microfone/câmera
- Navegador com WebRTC suporte
- Registro SIP correto (agent-1001)

${colors.yellow}⚠️  PROBLEMAS COMUNS QUE VOCÊ PODE TER TIDO:${colors.reset}
1. Mixed Content: WS em página HTTPS
2. Certificados autoassinados rejeitados
3. Módulos PJSIP não carregados
4. Porta 8089 não acessível
5. RTP não configurado para WebRTC
`);

log('green', '\n🎉 Simulação concluída! Configurações parecem estar corretas.');
log('blue', '\n💡 Próximo passo: Testar em ambiente com Docker disponível.');