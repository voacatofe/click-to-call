import AsteriskManager from 'asterisk-manager';
import { EventEmitter } from 'events';
import 'dotenv/config';

class AsteriskService extends EventEmitter {
  private ami: any;
  private connected = false;

  constructor() {
    super();
    this.initialize();
  }

  private initialize() {
    // No Docker, 'host.docker.internal' aponta para a máquina host
    const host = process.env.DOCKER_ENV ? 'host.docker.internal' : process.env.ASTERISK_HOST || 'localhost';
    const port = Number(process.env.ASTERISK_AMI_PORT ?? 5038);
    const user = process.env.ASTERISK_AMI_USER || 'admin';
    const password = process.env.ASTERISK_AMI_PASSWORD || 'secret';

    this.ami = new AsteriskManager(port, host, user, password, true);

    this.ami.on('connect', () => {
      this.connected = true;
      console.log('[Asterisk] AMI connected');
    });

    this.ami.on('error', (err: any) => {
      this.connected = false;
      console.error('[Asterisk] AMI error', err);
    });

    // Encaminhar eventos importantes
    ['dial', 'bridge', 'hangup'].forEach(evt => {
      this.ami.on(evt, (data: any) => this.emit(evt, data));
    });
  }

  async originateCall(agentId: string, destination: string, companyId: string) {
    if (!this.connected) throw new Error('AMI not connected');

    return new Promise<{ response: string; uniqueid?: string }>((resolve, reject) => {
      this.ami.action(
        {
          action: 'Originate',
          channel: `PJSIP/agent-${agentId}`,
          context: 'from-agents',
          exten: destination.replace(/\D/g, ''),
          priority: 1,
          callerid: `Company ${companyId}`,
          async: true,
        },
        (err: any, res: any) => {
          if (err) return reject(err);
          resolve(res);
        }
      );
    });
  }
}

export const asteriskService = new AsteriskService(); 