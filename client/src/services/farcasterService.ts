import axios from 'axios';

const API_KEY = 'NEYNAR_API_DOCS'; // Replace with your actual API key
const BASE_URL = 'https://api.neynar.com/v2/farcaster';

interface FarcasterUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
}

class FarcasterService {
  async getUserByFid(fid: number): Promise<FarcasterUser | null> {
    try {
      const response = await axios.get(`${BASE_URL}/user/bulk?fids=${fid}`, {
        headers: {
          accept: 'application/json',
          api_key: API_KEY,
        },
      });

      const users = response.data.users;
      if (users && users.length > 0) {
        return users[0];
      }
      return null;
    } catch (error) {
      console.error('Error fetching Farcaster user:', error);
      return null;
    }
  }
}

export const farcasterService = new FarcasterService();
