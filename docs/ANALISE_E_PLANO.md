# Análise Estrutural e Plano de Ação para o Projeto Click-to-Call

## 1. Visão Geral e Diagnóstico

Após uma análise detalhada dos logs, arquivos de configuração e da estrutura do projeto, a causa raiz dos problemas de inicialização foi identificada. O sintoma principal (`ECONNREFUSED` da API para o Asterisk) é resultado de uma combinação de fatores de rede e configuração no ambiente Docker.

### **Diagnóstico Principal:**

1.  **Conflito de Rede (`network_mode: host`):**
    *   **Problema:** O serviço `asterisk` usa `network_mode: host`, o que o coloca na rede da sua máquina (host), mas o isola da rede interna `clicktocall-network` onde os serviços `api` e `web` residem.
    *   **Consequência:** A API não consegue encontrar o Asterisk usando o nome de serviço `asterisk` porque eles não compartilham o mesmo DNS da rede Docker.

2.  **Restrição de Acesso no Asterisk (`manager.conf`):**
    *   **Problema:** O arquivo `manager.conf` está configurado para permitir conexões à interface AMI (`port: 5038`) apenas de `localhost` (`permit=127.0.0.1/...`).
    *   **Consequência:** Mesmo que a API consiga encontrar o caminho para o Asterisk (através do `host.docker.internal`), o Asterisk ativamente **recusa** a conexão porque ela não vem de `127.0.0.1`. Este é o motivo exato do erro `ECONNREFUSED`.

3.  **Configurações Mínimas Faltando:**
    *   **Problema:** A pasta `asterisk/etc` não continha um `asterisk.conf` básico, fazendo com que o Asterisk iniciasse com configurações padrão que não eram ideais e geravam muitos erros no log sobre módulos não encontrados.

## 2. A Solução Proposta (Arquitetura Robusta)

A solução mais limpa, segura e alinhada com as práticas de produção para Docker é abandonar o `network_mode: host` e fazer com que todos os serviços se comuniquem através de uma rede Docker comum.

### **Passo 1: Reestruturar o `docker-compose.yml`**

Esta é a mudança mais crítica e resolve o problema fundamental de rede.

*   **Remover `network_mode: host`** do serviço `asterisk`.
*   **Adicionar o `asterisk` à `clicktocall-network`**, unificando todos os serviços.
*   **Expor as portas do Asterisk** para que elas fiquem acessíveis de fora da rede Docker:
    *   `5038:5038` (para o AMI)
    *   `8088:8088` (para WebSocket - WS)
    *   `8089:8089` (para WebSocket Seguro - WSS)
    *   `10000-20000:10000-20000/udp` (para o tráfego de mídia RTP)
*   **Remover a configuração `extra_hosts`** do serviço `api`, pois não é mais necessária.

### **Passo 2: Corrigir o Acesso ao Asterisk**

Com a nova estrutura de rede, precisamos ajustar duas coisas:

*   **No `docker-compose.yml`:** Garantir que a variável de ambiente da API aponte para o nome do serviço correto.
    ```yaml
    services:
      api:
        environment:
          - ASTERISK_HOST=asterisk
    ```
*   **No `asterisk/etc/manager.conf`:** Permitir o acesso da rede Docker.
    ```ini
    [admin]
    permit=172.16.0.0/12  # Permite a faixa de IPs padrão do Docker
    ```
*   **No código da API (`asterisk.service.ts`):** Garantir que o `host` padrão para desenvolvimento local seja `localhost`, mas que ele use a variável de ambiente no Docker. O código atual já faz isso corretamente.
    ```typescript
    const host = process.env.ASTERISK_HOST || 'localhost';
    ```

### **Passo 3: Garantir Configurações Mínimas do Asterisk**

*   **Criar um arquivo `asterisk/etc/asterisk.conf`** com o conteúdo mínimo para que ele encontre seus diretórios, evitando a cascata de erros de "módulo não encontrado".
    ```ini
    [directories](!)
    astetcdir => /etc/asterisk
    astmoddir => /usr/lib/asterisk/modules
    astvarlibdir => /var/lib/asterisk
    astlogdir => /var/log/asterisk
    ; ... outros diretórios ...
    ```

## 3. Documentação e Próximos Passos

Esta documentação serve como um guia para a discussão. Uma vez que concordemos com este plano, podemos:

1.  Aplicar as alterações propostas aos arquivos (`docker-compose.yml`, `manager.conf`, `asterisk.conf`).
2.  Executar um `docker-compose up -d --build --force-recreate` para aplicar a nova arquitetura.
3.  Validar se todos os serviços sobem com sucesso e se os `healthchecks` ficam verdes.
4.  Testar a funcionalidade de chamada do softphone.

Esta abordagem resolve os problemas de forma estruturada, resultando em um ambiente de desenvolvimento e produção muito mais estável, previsível e seguro. 