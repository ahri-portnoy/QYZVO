import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User,
  Auth
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Add required Workspace scopes
provider.addScope('https://www.googleapis.com/auth/drive');
provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
provider.addScope('https://www.googleapis.com/auth/gmail.send');
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
provider.addScope('https://www.googleapis.com/auth/userinfo.email');

// Cache the access token in memory
let cachedAccessToken: string | null = null;

export const initWorkspaceAuth = (onAuthSuccess?: (user: User) => void, onAuthFailure?: () => void) => {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user);
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error('Could not obtain access token from Google');
    }

    cachedAccessToken = credential.accessToken;
    return {
      user: result.user,
      accessToken: cachedAccessToken
    };
  } catch (error) {
    console.error('Workspace Sign-in Error:', error);
    throw error;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const workspaceLogout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

/**
 * Uploads a file to Google Drive
 */
export const uploadFileToDrive = async (file: File): Promise<any> => {
  return uploadBlobToDrive(file, file.name, file.type);
};

/**
 * Uploads a blob to Google Drive
 */
export const uploadBlobToDrive = async (blob: Blob, name: string, mimeType: string): Promise<any> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google');

  const metadata = {
    name: name,
    mimeType: mimeType,
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', blob);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Upload failed: ${errorData.error?.message || response.statusText}`);
  }

  return response.json();
};

/**
 * Lists files from Google Drive with metadata
 */
export const listDriveFiles = async (): Promise<any[]> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google');

  const response = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=25&fields=files(id, name, mimeType, size, modifiedTime, webViewLink)&orderBy=modifiedTime desc', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to list files');
  }

  const data = await response.json();
  return data.files || [];
};

/**
 * Deletes a file from Google Drive
 */
export const deleteDriveFile = async (fileId: string): Promise<void> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google');

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Deletion failed: ${errorData.error?.message || response.statusText}`);
  }
};

/**
 * Lists recent emails from Gmail with detail headers parsed
 */
export const listGmailEmails = async (): Promise<any[]> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google');

  const listRes = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=15', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!listRes.ok) throw new Error('Failed to list emails');
  const listData = await listRes.json();
  const messages = listData.messages || [];

  const detailedMessages = await Promise.all(
    messages.map(async (msg: any) => {
      try {
        const detailRes = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date&metadataHeaders=To`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!detailRes.ok) return { id: msg.id, snippet: 'Failed to load details' };
        const detail = await detailRes.json();
        
        const headers = detail.payload?.headers || [];
        const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(No Subject)';
        const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Unknown';
        const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';
        const to = headers.find((h: any) => h.name.toLowerCase() === 'to')?.value || '';

        return {
          id: msg.id,
          threadId: msg.threadId,
          snippet: detail.snippet || '',
          subject,
          from,
          date,
          to
        };
      } catch (e) {
        return { id: msg.id, snippet: 'Error loading details' };
      }
    })
  );

  return detailedMessages;
};

/**
 * Fetches an email message details and parses the body text from base64
 */
export const getGmailEmail = async (messageId: string): Promise<any> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google');

  const res = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to load email details');
  const detail = await res.json();
  
  const headers = detail.payload?.headers || [];
  const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(No Subject)';
  const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Unknown';
  const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';
  const to = headers.find((h: any) => h.name.toLowerCase() === 'to')?.value || '';

  let body = '';
  const decodeBase64 = (str: string) => {
    try {
      return decodeURIComponent(escape(atob(str.replace(/-/g, '+').replace(/_/g, '/'))));
    } catch {
      try {
        return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
      } catch {
        return str;
      }
    }
  };

  const traverseParts = (part: any): string => {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      return decodeBase64(part.body.data);
    }
    if (part.parts) {
      for (const subPart of part.parts) {
        const found = traverseParts(subPart);
        if (found) return found;
      }
    }
    return '';
  };

  if (detail.payload?.parts) {
    body = traverseParts(detail.payload);
  } else if (detail.payload?.body?.data) {
    body = decodeBase64(detail.payload.body.data);
  }

  if (!body) body = detail.snippet || '';

  return {
    id: detail.id,
    subject,
    from,
    date,
    to,
    body,
    snippet: detail.snippet
  };
};

/**
 * Sends a clean Hebrew-supporting, base64-transfer encoded email through Gmail
 */
export const sendGmailEmail = async (to: string, subject: string, body: string): Promise<any> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google');

  const u8ToBase64 = (str: string) => {
    return btoa(unescape(encodeURIComponent(str)));
  };

  const rfc2822Lines = [
    `To: ${to}`,
    `Subject: =?utf-8?B?${u8ToBase64(subject)}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    u8ToBase64(body)
  ];

  const raw = btoa(unescape(encodeURIComponent(rfc2822Lines.join('\r\n'))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to send email: ${errorData.error?.message || response.statusText}`);
  }

  return response.json();
};
