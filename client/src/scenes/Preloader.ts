import { Scene } from 'phaser';
import { SceneKey } from '~/enums/SceneKey';
import { farcasterService } from '~/services/farcasterService';
import { socketService } from '~/services/socketService';

export class Preloader extends Scene {
  private userFid: number | null = null;
  private userPfpUrl: string | null = null;

  constructor() {
    super(SceneKey.Preloader);
  }

  init() {
    console.log('Preloader scene initialized');
    this.initializeSocket();
  }

  private initializeSocket() {
    console.log('Attempting to connect to socket');
    socketService.connect();

    socketService.on('userData', ({ fid, data }) => {
      console.log(`Received user data for FID ${fid}:`, data);
      this.userFid = fid;
      this.loadUserData(fid);
    });
  }

  private async loadUserData(fid: number) {
    const user = await farcasterService.getUserByFid(fid);
    if (user && user.pfp_url) {
      this.userPfpUrl = user.pfp_url;
      this.load.image('userPfp', this.userPfpUrl);
      this.load.once('complete', this.onLoadComplete, this);
      this.load.start();
    } else {
      this.onLoadComplete();
    }
  }

  private onLoadComplete() {
    console.log('User data loaded, starting Boot scene');
    this.scene.start(SceneKey.Boot, { userFid: this.userFid, userPfpUrl: this.userPfpUrl });
  }
}
