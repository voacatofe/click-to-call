import 'dotenv/config';
import axios from 'axios';
import rateLimit from 'axios-rate-limit';

const RDRM_API_URL = 'https://crm.rdstation.com/api/v1'; // Corrigido: Usando o domínio correto da API de CRM

const baseApiClient = axios.create({
  baseURL: RDRM_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Aplica o rate limiting ao cliente axios
// maxRequests: 100 requisições, perMilliseconds: 60000 (1 minuto)
const apiClient = rateLimit(baseApiClient, { maxRequests: 100, perMilliseconds: 60000 });


// Log para verificar se o token está sendo carregado
// console.log('RD CRM Token Loaded:', process.env.API_RDCRM_TOKEN ? `Token starting with ${process.env.API_RDCRM_TOKEN.substring(0, 4)}...` : 'Token not found!');

export const getContacts = async (token: string) => {
  if (!token) {
    throw new Error('RD Station token was not provided to getContacts service.');
  }
  try {
    // Corrigido: Usando o token recebido como parâmetro
    const response = await apiClient.get('/contacts', {
      params: {
        token: token
      }
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching contacts from RD CRM:');
    if (error.response) {
      // O servidor respondeu com um status code fora da faixa de 2xx
      console.error('Data:', error.response.data);
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      console.error('Request:', error.request);
    } else {
      // Algo aconteceu ao configurar a requisição
      console.error('Error Message:', error.message);
    }
    throw error;
  }
}; 