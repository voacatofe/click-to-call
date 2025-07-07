import { Request, Response } from 'express';
import { getCalls, createCall } from '../services/call.service';
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

  try {
    // 1. Cria o registro inicial no nosso banco
    const initialCall = await createCall({
      company_id: companyId,
      to_number: to,
      status: 'initiated',
    });

    // 2. Inicia a chamada via Asterisk
    const asteriskRes: any = await asteriskService.originateCall(agentId, to, companyId);

    // 3. TODO: Atualizar nosso registro com o twilio_call_sid
    // await updateCall(initialCall.id, { twilio_call_sid: twilioCall.sid });

    res.status(200).json({
      message: 'Call initiated successfully',
      call_id: initialCall.id,
      asterisk_response: asteriskRes.response,
      uniqueid: asteriskRes?.uniqueid
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to initiate call' });
  }
}; 