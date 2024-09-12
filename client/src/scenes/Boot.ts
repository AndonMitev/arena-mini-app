import { ProgressBar } from '~/ProgressBar';
import { SceneKey } from '~/enums/SceneKey';

export class Boot extends Phaser.Scene {
  private userFid: number | null = null;
  private userPfpUrl: string | null = null;

  constructor() {
    super(SceneKey.Boot);
  }

  init(data: { userFid: number | null; userPfpUrl: string | null }) {
    console.log('Boot scene initialized with user data:', data);
    this.userFid = data.userFid;
    this.userPfpUrl = data.userPfpUrl;
  }

  preload(): void {
    this.load.setPath('assets/gamedevjs2024');
    new ProgressBar(this);
    this.loadImages();
    this.loadSounds();
    this.loadFonts();
    this.preloadSpineAnimations();

    // Load the user's PFP
    if (this.userPfpUrl) {
      this.load.image('playerPfp', this.userPfpUrl);
    } else {
      // Load a default player sprite if no PFP is available
      this.load.image('playerPfp', 'default_player.png');
    }
  }

  loadImages() {
    this.load.image('trailTexture', 'trailTexture.png');
    // Remove or comment out the previous player image load
    // this.load.image('player', '...');
  }

  loadSounds() {
    this.load.audio('bgm', 'sounds/bgm-half.mp3');
    this.load.audio('click1', 'sounds/click1.wav');
    this.load.audio('click2', 'sounds/click2.wav');
    this.load.audio('click3', 'sounds/click3.wav');
    this.load.audio('click4', 'sounds/click4.wav');
    this.load.audio('click5', 'sounds/click5.wav');

    this.load.audio('fallinhole1', 'sounds/fallinhole1.wav');
    this.load.audio('fallinhole2', 'sounds/fallinhole2.wav');
    this.load.audio('fallinhole3', 'sounds/fallinhole3.wav');

    this.load.audio('explotion1', 'sounds/explotion1.wav', { instances: 3 });

    this.load.audio('player-die1', 'sounds/player-die1.wav');

    this.load.audio('ui-click1', 'sounds/ui-click1.wav');

    this.load.audio('discharge1', 'sounds/discharge1.wav');
  }

  preloadSpineAnimations() {
    // Need to set path to "" to be able to load the packed images correctly
    this.load.setPath('');
    this.load.spineBinary('enemy-skel', 'assets/gamedevjs2024/spine/enemy.skel');
    this.load.spineAtlas('enemy-atlas', 'assets/gamedevjs2024/spine/enemy.atlas');
    this.load.spineBinary('hole-skel', 'assets/gamedevjs2024/spine/hole.skel');
    this.load.spineAtlas('hole-atlas', 'assets/gamedevjs2024/spine/hole.atlas');
    this.load.spineBinary('battery-skel', 'assets/gamedevjs2024/spine/battery.skel');
    this.load.spineAtlas('battery-atlas', 'assets/gamedevjs2024/spine/battery.atlas');
    this.load.spineBinary('hand-skel', 'assets/gamedevjs2024/spine/hand.skel');
    this.load.spineAtlas('hand-atlas', 'assets/gamedevjs2024/spine/hand.atlas');
    this.load.spineBinary('discharge-skel', 'assets/gamedevjs2024/spine/discharge.skel');
    this.load.spineAtlas('discharge-atlas', 'assets/gamedevjs2024/spine/discharge.atlas');
    this.load.spineBinary('title-skel', 'assets/gamedevjs2024/spine/title.skel');
    this.load.spineAtlas('title-atlas', 'assets/gamedevjs2024/spine/title.atlas');
  }

  loadUi(): void {
    // this.load.image('icon-home', 'ui/icon-home.png');
  }

  loadFont(name: string, url: string) {
    const newFont = new FontFace(name, `url(${url})`);
    newFont
      .load()
      .then((loaded) => {
        document.fonts.add(loaded);
      })
      .catch((error) => {
        console.log('err', error);
        return error;
      });
  }

  loadFonts() {
    this.loadFont('ConcertOne', 'assets/gamedevjs2024/fonts/ConcertOne-Regular.ttf');
  }

  create(): void {
    console.log('Boot scene created, starting Intro scene');
    this.scene.start(SceneKey.Intro);
  }
}
