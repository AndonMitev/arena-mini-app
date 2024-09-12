import { Scene } from 'phaser';
import { Subscription } from 'rxjs/internal/Subscription';
import { take } from 'rxjs/internal/operators/take';
import { BodyTypeLabel } from '~/enums/BodyTypeLabel';
import { DepthGroup } from '~/enums/DepthGroup';
import { GameEvent } from '~/enums/GameEvent';
import { emit, off, on } from '~/utils/eventEmitterUtils';
import { createText } from '~/utils/textUtils';
import { startWaitRoutine } from '~/utils/gameUtils';
import { MAX_CHARGES } from './Battery';
import { playPlayerDie } from './utils/audioUtils';

type PlayerOptions = { startPos: Phaser.Math.Vector2 };
type TrailParticle = { pos: Phaser.Math.Vector2; timeToLive: number; maxLifeTime: number };
const BALL_RADIUS = 23;
const MAX_SHOTS = 5;
const TEXT_OFFSET = new Phaser.Math.Vector2(2, 70);
const RELASE_DEADZONE = 40;
const VELOCITY_DEADZONE = 2;
const MAX_FORCE_DIFF = 300;

export class Player {
  sprite: Phaser.GameObjects.Sprite;
  mask: Phaser.GameObjects.Graphics;
  ball: MatterJS.BodyType;
  trailRope: Phaser.GameObjects.Rope;
  startPoint: Phaser.Math.Vector2;
  deadPos: Phaser.Math.Vector2;
  waitBeforeDieSubscription: Subscription;
  state: '' | 'dead' = '';
  shots = MAX_SHOTS;
  trailParticles: TrailParticle[] = [];

  shotsTxt: Phaser.GameObjects.Text;
  shotsTxtContainer: Phaser.GameObjects.Container;

  constructor(
    private scene: Scene,
    playerOptions: PlayerOptions
  ) {
    this.startPoint = playerOptions.startPos;
    this.init();
  }

  init() {
    this.initSprite();
    this.initPhysics();
    this.listenForEvents();
    this.initShotsTxt();
    this.initTrail();
  }

  initSprite() {
    // Create a circular mask
    this.mask = this.scene.make.graphics({});
    this.mask.fillStyle(0xffffff);
    this.mask.fillCircle(BALL_RADIUS, BALL_RADIUS, BALL_RADIUS);

    // Create the sprite and apply the mask
    this.sprite = this.scene.add
      .sprite(this.startPoint.x, this.startPoint.y, 'playerPfp')
      .setDisplaySize(BALL_RADIUS * 2, BALL_RADIUS * 2)
      .setDepth(DepthGroup.player);

    this.sprite.setMask(this.mask.createGeometryMask());

    this.scene.cameras.main.startFollow(this.sprite, true, 0, 0.2);
  }

  initPhysics() {
    this.ball = this.scene.matter.add.circle(this.startPoint.x, this.startPoint.y, BALL_RADIUS, {
      label: BodyTypeLabel.player,
      frictionAir: 0.028,
      friction: 0.1,
      restitution: 0.7,
    });
  }

  initShotsTxt() {
    this.shotsTxt = createText(this.scene, 0, 0, 50, this.getShotsText(), { align: 'center' });
    this.shotsTxtContainer = this.scene.add
      .container(this.x + TEXT_OFFSET.x, this.y + TEXT_OFFSET.y, this.shotsTxt)
      .setDepth(DepthGroup.ui);
  }

  initTrail() {
    this.trailRope = this.scene.add.rope(0, 0, 'trailTexture');
    this.trailRope.setPoints(150);
    this.trailRope.setColors(0x115424);
    this.trailRope.setDepth(DepthGroup.player - 1);
  }

  listenForEvents() {
    on(GameEvent.startBallThrow, this.onStartBallThrow);
    on(GameEvent.releaseBallThrow, this.onReleaseBallThrow);
    on(GameEvent.fallInHole, this.fallInHole);
    on(GameEvent.batteryChange, this.batteryChange);
  }

  onStartBallThrow = () => {
    if (this.state === 'dead') return;
    this.shotsTxt.alpha = 1;
  };

  onReleaseBallThrow = ({ holdDuration, diffX, diffY }) => {
    if (this.state === 'dead') return;
    if (Math.abs(diffX) < RELASE_DEADZONE && Math.abs(diffY) < RELASE_DEADZONE) return;
    if (this.shots <= 0) return;
    if (Math.abs(diffX) > MAX_FORCE_DIFF) diffX = MAX_FORCE_DIFF * Math.sign(diffX);
    if (Math.abs(diffY) > MAX_FORCE_DIFF) diffY = MAX_FORCE_DIFF * Math.sign(diffY);
    const force = new Phaser.Math.Vector2(
      Math.min(1, diffX / -MAX_FORCE_DIFF),
      Math.max(-1, diffY / -MAX_FORCE_DIFF)
    ).scale(0.18);
    this.scene.matter.applyForce(this.ball, force);
    this.addShots(-1);
  };

  fallInHole = (data: { other: MatterJS.BodyType; hole: MatterJS.BodyType; points: number }) => {
    if (data.other === this.ball) {
      this.scene.add.tween({
        targets: this.sprite,
        x: data.hole.position.x,
        y: data.hole.position.y,
        duration: 1000,
      });
      this.startDieRoutine();
    } else if (data.other.label === BodyTypeLabel.enemy) {
      this.addShots(data.points);
    }
  };

  batteryChange = ({ newValue, oldValue }) => {
    if (this.state === 'dead') return;
    // Implement battery change logic if needed
  };

  update(time: number, delta: number) {
    this.handleTrail(time, delta);
    if (this.state === 'dead') return;
    this.sprite.setPosition(this.ball.position.x, this.ball.position.y);
    this.sprite.setDepth(DepthGroup.player + 1 / Math.abs(this.ball.position.y - 3000));
    // Update mask position
    this.mask.setPosition(this.ball.position.x - BALL_RADIUS, this.ball.position.y - BALL_RADIUS);
    if (this.shotsTxtContainer) {
      this.shotsTxtContainer.x = this.ball.position.x + TEXT_OFFSET.x;
      this.shotsTxtContainer.y = this.ball.position.y + TEXT_OFFSET.y;
    }
    this.handleOutOfShots();
  }

  handleTrail(time: number, delta: number) {
    // Implement trail logic here
  }

  handleOutOfShots() {
    if (this.state === 'dead' || this.waitBeforeDieSubscription) return;
    if (
      this.shots <= 0 &&
      Math.abs(this.ball.velocity.y) < VELOCITY_DEADZONE &&
      Math.abs(this.ball.velocity.x) < VELOCITY_DEADZONE
    ) {
      this.waitBeforeDieSubscription = startWaitRoutine(this.scene, 3000)
        .pipe(take(1))
        .subscribe(() => {
          if (this.shots > 0) return;
          this.startDieRoutine();
        });
    }
  }

  getShotsText() {
    return `SHOTS\n${this.shots} / ${MAX_SHOTS}`;
  }

  addShots(num: number) {
    this.shots += num;
    if (this.shots >= MAX_SHOTS) this.shots = MAX_SHOTS;
    this.shotsTxt.text = this.getShotsText();
    if (this.shots > 0) {
      this.waitBeforeDieSubscription?.unsubscribe();
      this.waitBeforeDieSubscription = null;
      this.state = '';
    }
  }

  startDieRoutine() {
    if (this.state === 'dead') return;
    this.state = 'dead';
    this.sprite.setTint(0x888888); // Darken the sprite to indicate death
    playPlayerDie();
    this.destroyPhysicsObjects();
    this.scene.time.delayedCall(1000, () => {
      this.destroy();
    });
  }

  private destroyPhysicsObjects() {
    if (!this.ball) return;
    this.deadPos = new Phaser.Math.Vector2(this.ball.position.x, this.ball.position.y);
    this.scene.matter.world.remove(this.ball);
  }

  private destroy() {
    this.state = 'dead';
    this.removeEventListeners();
    this.sprite.destroy();
    this.sprite = null;
    this.mask.destroy();
    this.mask = null;
    this.shotsTxt.destroy();
    this.shotsTxt = null;
    this.shotsTxtContainer.destroy();
    this.shotsTxtContainer = null;
    this.ball = null;
    this.trailParticles.length = 0;
    this.trailRope.destroy();
    this.trailRope = null;
    emit(GameEvent.gameOver);
  }

  removeEventListeners() {
    off(GameEvent.startBallThrow, this.onStartBallThrow);
    off(GameEvent.releaseBallThrow, this.onReleaseBallThrow);
    off(GameEvent.fallInHole, this.fallInHole);
    off(GameEvent.batteryChange, this.batteryChange);
  }

  get x() {
    if (this.state === 'dead') return this.deadPos.x;
    return this.ball.position.x;
  }

  get y() {
    if (this.state === 'dead') return this.deadPos.y;
    return this.ball.position.y;
  }
}
