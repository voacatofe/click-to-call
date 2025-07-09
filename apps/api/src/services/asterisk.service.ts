import AsteriskManager from 'asterisk-manager';
import { EventEmitter } from 'events';

// Função para validar variáveis de ambiente críticas
const getRequiredEnv = (varName: string): string => {
  const value = process.env[varName];
  if (!value) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
  return value;
};

// Validar todas as variáveis de uma vez
const host = getRequiredEnv('ASTERISK_HOST');
const port = Number(getRequiredEnv('ASTERISK_AMI_PORT'));
const user = getRequiredEnv('ASTERISK_AMI_USER');
const password = getRequiredEnv('ASTERISK_AMI_PASSWORD');

class AsteriskService extends EventEmitter {
  private ami: any;
  private isConnected: boolean = false;

  constructor() {
    super();
    this.ami = new AsteriskManager(port, host, user, password, true);
    this.ami.on('managerevent', (evt: any) => this.emit('ami_event', evt));
    this.ami.on('response', (res: any) => this.handleResponse(res));
    this.ami.on('connect', () => {
      this.isConnected = true;
      console.log('✅ Conectado à interface AMI do Asterisk');
    });
    this.ami.on('disconnect', () => {
      this.isConnected = false;
      console.log('🔌 Desconectado da interface AMI do Asterisk');
    });
    this.ami.on('error', (err: any) => {
      this.isConnected = false;
      console.error('❌ Erro na conexão AMI:', err);
    });
  }

  private handleResponse(res: any) {
    if (res.response === 'Success') {
      // console.log('Ação AMI bem-sucedida:', res.actionid);
    } else if (res.response === 'Error') {
      console.error(`❌ Erro na ação AMI: ${res.message}`);
    }
  }

  public async originateCall(agentId: string, toNumber: string, companyId: string) {
    if (!this.isConnected) {
      throw new Error('Não foi possível originar a chamada: AMI não está conectado.');
    }

    const action = {
      action: 'originate',
      channel: `PJSIP/${agentId}`,
      context: 'from-internal',
      exten: toNumber,
          priority: 1,
      callerid: `Click-to-Call <${companyId}>`,
      variable: {
        COMPANY_ID: companyId
      }
    };

    return new Promise((resolve, reject) => {
      this.ami.action(action, (err: any, res: any) => {
        if (err) {
          return reject(err);
        }
          resolve(res);
      });
    });
  }
}

export const asteriskService = new AsteriskService(); 