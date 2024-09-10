import { Game } from 'phaser';
import { SpinePlugin } from '@esotericsoftware/spine-phaser';

import { MatterGravityFixPlugin } from '~/plugins/MatterGravityFixPlugin';
import { MatterFixedStepPlugin } from '~/plugins/MatterFixStepPlugin';

import { setGame } from '~/gameManager';
import { SceneKey } from '~/enums/SceneKey';
import { GAME_HEIGHT, GAME_WIDTH, getCanvas } from '~/utils/gameUtils';
import { destroyMusicAndSfx, initMusicAndSfx } from '~/utils/audioUtils';
import { Intro } from '~/scenes/Intro';
import { MainMenu } from '~/scenes/MainMenu';
import { UserInterface } from '~/scenes/UserInterface';
import { Boot } from '~/scenes/Boot';
import { Level } from '~/scenes/Level';
import { GameOver } from '~/scenes/GameOver';
import { HUD } from '~/scenes/HUD';
import { MyColor } from '~/enums/MyColor';
import { socketService } from './services/socketService';

const addScenes = (game: Game) => {
  game.scene.add(SceneKey.Intro, Intro);
  game.scene.add(SceneKey.MainMenu, MainMenu);
  game.scene.add(SceneKey.UserInterface, UserInterface);
  game.scene.add(SceneKey.Level, Level);
  game.scene.add(SceneKey.GameOver, GameOver);
  game.scene.add(SceneKey.HUD, HUD);
  game.scene.add(SceneKey.Boot, Boot, true);
};

export class MyGame {
  game: Game;
  private sessionId: string | null = null;

  constructor() {
    this.initGame();
    this.initializeSocket();
  }

  private initializeSocket() {
    socketService.connect();

    socketService.on('sessionCreated', ({ sessionId, fid }) => {
      this.sessionId = sessionId;
      console.log(`Session created for game: ${sessionId} (FID: ${fid})`);
      // You might want to do some initialization here with the FID
    });

    socketService.on('userData', (data) => {
      const currentFid = socketService.getCurrentFid();
      console.log(`Received user data in MyGame for FID ${currentFid}:`, data);
      // Handle the received data in your game
    });
  }

  async initGame() {
    this.game = new Game({
      type: Phaser.WEBGL,
      canvas: getCanvas(),
      width: GAME_WIDTH, // smart phone vertical
      height: GAME_HEIGHT,
      backgroundColor: MyColor.blackStr,
      physics: {
        default: 'matter',
        matter: {
          debug: true, // TODO (johnedvard) remove debug if production
          gravity: { x: 0, y: 0 },
          autoUpdate: false,
        },
      },
      input: {
        gamepad: true,
      },
      plugins: {
        scene: [
          { key: 'spine.SpinePlugin', plugin: SpinePlugin, mapping: 'spine' },
          {
            key: 'MatterGravityFixPlugin',
            plugin: MatterGravityFixPlugin,
            mapping: 'matterGravityFix',
            start: true,
          },
          {
            key: 'MatterFixedStepPlugin',
            plugin: MatterFixedStepPlugin,
            start: true,
          },
        ],
      },
      scale: {
        mode: Phaser.Scale.HEIGHT_CONTROLS_WIDTH,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    });
    addScenes(this.game);
    setGame(this.game);
    this.preventScroll();
  }
  preventScroll() {
    window.addEventListener('wheel', (event) => event.preventDefault(), {
      passive: false,
    });

    window.addEventListener('keydown', (event) => {
      if (['ArrowUp', 'ArrowDown', ' '].includes(event.key)) {
        event.preventDefault();
      }
    });
  }

  destroyGame() {
    if (this.game) {
      destroyMusicAndSfx();
      this.game.destroy(true);
    }
    this.game = null;
  }
}
