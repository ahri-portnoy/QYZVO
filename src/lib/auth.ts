import { getAccessToken as getWorkspaceToken } from '../services/workspaceService';

export const initAuth = (clientId: string) => {
  // Logic moved to workspaceService.ts using Firebase
  console.log('Main auth initialized with clientId:', clientId);
};

export const getAccessToken = async (_interactive = false): Promise<string> => {
  const token = await getWorkspaceToken();
  if (!token) {
    throw new Error('Google Drive access not authenticated. Please use the connection button in chat.');
  }
  return token;
};
