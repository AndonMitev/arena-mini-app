import { Scene } from 'phaser';
import { SceneKey } from '~/enums/SceneKey';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const NEYNAR_API_KEY = 'NEYNAR_API_DOCS';
const NEYNAR_API_URL = 'https://api.neynar.com/v1/farcaster/user';

export class Preloader extends Scene {
  private userFid: number | null = null;
  private userPfpUrl: string | null = null;
  private dataLoaded: boolean = false;

  constructor() {
    super(SceneKey.Preloader);
  }

  init() {
    console.log('Preloader scene initialized');
  }

  async preload() {
    try {
      // 1. Read session ID from the URL
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('sessionId');
      console.log('Session ID:', sessionId);
      if (!sessionId) {
        throw new Error('Session ID not found in URL');
      }

      // 2. Fetch user info from Supabase to get FID
      const { data: sessionData, error: supabaseError } = await supabase
        .from('tip_shots_user_sessions')
        .select('fid')
        .eq('session_id', sessionId)
        .single();
      console.log('Session Data:', sessionData);
      if (supabaseError || !sessionData) {
        throw new Error('Failed to fetch user data from Supabase');
      }

      this.userFid = sessionData.fid;

      // 3. Fetch from Neynar using the FID
      const neynarResponse = await axios.get(NEYNAR_API_URL, {
        params: { fid: this.userFid },
        headers: { api_key: NEYNAR_API_KEY },
      });
      console.log('Neynar Response:', neynarResponse);
      const userData = neynarResponse.data.result.user;

      // 4. Update Supabase with additional user data
      // const { error: updateError } = await supabase
      //   .from('tip_shots_user_sessions')
      //   .update({
      //     username: userData.username,
      //     display_name: userData.displayName,
      //     avatar_url: userData.pfp.url,
      //   })
      //   .eq('session_id', sessionId);

      // if (updateError) {
      //   console.error('Error updating user data in Supabase:', updateError);
      // }

      // Set user PFP URL and load the image
      console.log('User Data:', userData);
      this.userPfpUrl = userData.pfp.url;
      this.load.image('playerPfp', this.userPfpUrl);

      // Add a load complete event listener
      this.load.on('complete', this.onLoadComplete, this);

      this.load.start();
    } catch (error) {
      console.error('Error in preloadUserData:', error);
      // Handle the error appropriately (e.g., show an error message to the user)
      this.onLoadComplete();
    }
  }

  private onLoadComplete = () => {
    this.dataLoaded = true;
    console.log('User data loaded, starting Boot scene');
    this.scene.start(SceneKey.Boot, { userFid: this.userFid, userPfpUrl: this.userPfpUrl });
  };

  create() {
    // This method will be called when the scene is created, but we'll use it as a fallback
    if (!this.dataLoaded) {
      console.log('Create method called before data load completed');
      // You can add a loading indicator here if needed
    }
  }
}
