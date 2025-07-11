import { Request, Response } from 'express';
import { getCalls, createCall, updateCall } from '../services/call.service';
import { asteriskService } from '../services/asterisk.service';

export const listCallsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const calls = await getCalls();
    res.status(200).json(calls);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch calls' });
  }
};

export const createCallController = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validação básica, pode ser aprimorada depois
    if (!req.body || Object.keys(req.body).length === 0) {
      res.status(400).json({ message: 'Call data is required' });
      return;
    }
    const newCall = await createCall(req.body);
    res.status(201).json(newCall);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create call' });
  }
};

export const startCallController = async (req: Request, res: Response): Promise<void> => {
  const { to, companyId, agentId } = req.body;

  if (!to || !companyId || !agentId) {
    res.status(400).json({ message: 'Fields "to", "companyId" and "agentId" are required.' });
    return;
  }

  let callId = '';
  try {
    // 1. Cria o registro inicial no nosso banco
    const initialCall = await createCall({
      company_id: companyId,
      to_number: to,
      agent_id: agentId,
      status: 'initiated',
    });
    callId = initialCall.id; // Guarda o ID para o caso de erro

    // 2. Inicia a chamada via Asterisk
    const asteriskRes: any = await asteriskService.originateCall(agentId, to, companyId);

    // Se a originaçao no Asterisk for bem sucedida, atualiza nosso registro
    if (asteriskRes && asteriskRes.response === 'Success') {
      await updateCall(initialCall.id, {
        status: 'ringing', // ou 'in-progress' dependendo do evento
        asterisk_unique_id: asteriskRes.uniqueid,
      });
    } else {
      // Se falhar, marcamos a chamada como 'failed' no nosso banco
      await updateCall(initialCall.id, { status: 'failed' });
      throw new Error(asteriskRes?.message || 'Failed to originate call in Asterisk');
    }

    res.status(200).json({
      message: 'Call initiated successfully',
      call_id: initialCall.id,
      asterisk_response: asteriskRes.response,
      uniqueid: asteriskRes?.uniqueid
    });

  } catch (error: any) {
    // Se um erro ocorreu APÓS a chamada ser criada, tentamos marcá-la como 'failed'
    if (callId) {
      await updateCall(callId, { status: 'failed' }).catch(err => {
        // Loga um erro se não conseguir nem mesmo atualizar o status para falha
        console.error(`CRITICAL: Failed to mark call ${callId} as 'failed'.`, err);
      });
    }
    res.status(500).json({ message: error.message || 'Failed to initiate call' });
  }
}; 