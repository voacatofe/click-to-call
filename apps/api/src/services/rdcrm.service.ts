import axios from 'axios';
import rateLimit from 'axios-rate-limit';

const RDRM_API_URL = 'https://crm.rdstation.com/api/v1';

const http = rateLimit(axios.create(), {
  maxRequests: 1,
  perMilliseconds: 1000,
});

export const getContacts = async (apiToken: string) => {
  try {
    const response = await http.get(`${RDRM_API_URL}/contacts`, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching contacts from RD CRM:', error);
    throw new Error('Failed to fetch contacts');
  }
}; 