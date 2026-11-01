import Phaser from 'phaser';
import { COLORS, FONT_FAMILY, GAME_HEIGHT, GAME_WIDTH } from '../theme';
import type { AccessibilitySettings, HudSnapshot, ObservationStatus } from '../types';

const LABEL_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  color: '#a4aa9a',
  fontFamily: FONT_FAMILY,
  fontSize: '12px',
};

const INK_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  color: '#e7eadf',
  fontFamily: FONT_FAMILY,
  fontSize: '18px',
};

const OBSERVATION_LABELS: Record<ObservationStatus, { text: string; color: string }> = {
  observed: { text: 'GLANCING MAN: OBSERVED — HOLDING', color: '#a4c477' },
  unseen: { text: 'GLANCING MAN: UNOBSERVED — MOVING', color: '#c45347' },
  occluded: { text: 'GLANCING MAN: OCCLUDED — MOVING', color: '#e0a34a' },
  blinking: { text: 'GLANCING MAN: BLINKING — EXPOSED', color: '#c45347' },
  intake: { text: 'GLANCING MAN: INTAKE TRIAL — HOLDING', color: '#a4aa9a' },
};

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remainder = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
}

function focusMeter(focus: number): string {
  const filled = Math.ceil(focus * 10);
  return `[${'='.repeat(filled)}${'-'.repeat(10 - filled)}]`;
}

export class Hud {
  private readonly scene: Phaser.Scene;
  private readonly statusText: Phaser.GameObjects.Text;
  private readonly timerText: Phaser.GameObjects.Text;
  private readonly keyText: Phaser.GameObjects.Text;
  private readonly focusText: Phaser.GameObjects.Text;
  private readonly objectiveText: Phaser.GameObjects.Text;
  private readonly settingsText: Phaser.GameObjects.Text;
  private readonly noticeText: Phaser.GameObjects.Text;
  private overlay?: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    scene.add.rectangle(GAME_WIDTH / 2, 56, GAME_WIDTH, 112, COLORS.void).setDepth(25);
    scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 20, GAME_WIDTH, 40, COLORS.void).setDepth(25);
    scene.add.rectangle(GAME_WIDTH / 2, 112, GAME_WIDTH, 1, COLORS.wallEdge, 0.7).setDepth(25);
    scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 40, GAME_WIDTH, 1, COLORS.wallEdge, 0.7).setDepth(25);

    scene.add.text(40, 22, 'MEME CITY / DEPARTMENT OF PUBLIC CONTAINMENT', LABEL_STYLE).setDepth(30);
    scene.add.text(40, 44, 'FORM 27-B — ESCAPE AUTHORIZATION', INK_STYLE).setDepth(30);
    this.objectiveText = scene.add.text(430, 34, '1. RECOVER TEMPLATE KEY\n\n2. REPORT TO EXIT 04', {
      color: '#a4aa9a',
      fontFamily: FONT_FAMILY,
      fontSize: '13px',
    }).setDepth(30);
    this.timerText = scene.add.text(GAME_WIDTH - 40, 22, 'RUN 00:00', { ...LABEL_STYLE, color: '#e7eadf' }).setOrigin(1, 0).setDepth(30);
    this.keyText = scene.add.text(GAME_WIDTH - 40, 46, 'KEY: NOT ISSUED', { ...LABEL_STYLE, color: '#a4aa9a' }).setOrigin(1, 0).setDepth(30);

    scene.add.text(40, 82, 'PROCEDURE: KEEP THE GLANCING MAN INSIDE YOUR VIEW.', { ...LABEL_STYLE, fontSize: '11px' }).setDepth(30);
    this.statusText = scene.add.text(GAME_WIDTH - 40, 84, '', { ...LABEL_STYLE }).setOrigin(1, 0).setDepth(30);
    this.focusText = scene.add.text(576, 84, 'EYE CONTACT [==========]', LABEL_STYLE).setOrigin(0.5, 0).setDepth(30);

    this.settingsText = scene.add.text(40, GAME_HEIGHT - 32, '', LABEL_STYLE).setDepth(30);
    scene.add
      .text(GAME_WIDTH - 40, GAME_HEIGHT - 32, 'ESC PAUSE · [1-4] PARAMETERS · R RESTART', { ...LABEL_STYLE, fontSize: '11px' })
      .setOrigin(1, 0)
      .setDepth(30);

    this.noticeText = scene.add
      .text(GAME_WIDTH / 2, 636, '', {
        ...LABEL_STYLE,
        fontSize: '15px',
      })
      .setOrigin(0.5, 0.5)
      .setAlpha(0)
      .setDepth(31);
  }

  update(snapshot: HudSnapshot): void {
    this.timerText.setText(`RUN ${formatTime(snapshot.elapsedSeconds)}`);
    this.keyText
      .setText(snapshot.hasKey ? 'KEY: POSSESSED' : 'KEY: NOT ISSUED')
      .setColor(snapshot.hasKey ? '#a4c477' : '#a4aa9a');

    const observation = OBSERVATION_LABELS[snapshot.observation];
    this.statusText.setText(observation.text).setColor(observation.color);

    this.focusText.setText(`EYE CONTACT ${focusMeter(snapshot.focus)}`);
    this.focusText.setColor(snapshot.focus <= 0.25 ? '#c45347' : snapshot.focus <= 0.5 ? '#e0a34a' : '#a4aa9a');

    this.objectiveText
      .setText(snapshot.hasKey ? '1. TEMPLATE KEY POSSESSED\n\n2. REPORT TO EXIT 04' : '1. RECOVER TEMPLATE KEY\n\n2. REPORT TO EXIT 04')
      .setColor(snapshot.hasKey ? '#a4c477' : '#a4aa9a');
  }

  showNotice(text: string, color: string): void {
    this.noticeText.setText(text).setColor(color).setAlpha(1);
  }

  fadeNotice(ratio: number): void {
    if (this.noticeText.alpha > 0) {
      this.noticeText.setAlpha(Math.max(0, ratio));
    }
  }

  showBriefing(settings: AccessibilitySettings): void {
    this.showOverlay([
      this.makeOverlayTitle('MEME CITY', '#e7eadf', 58, 134),
      this.makeOverlayTitle('BRAINROT ESCAPE', '#a4c477', 25, 192),
      this.makeOverlayText(80, 234, 'DEPARTMENT OF PUBLIC CONTAINMENT — NIGHT DESK', '13px', '#a4aa9a'),
      this.makeOverlayText(80, 278, 'NOTICE 06: THE GLANCING MAN', '20px', '#e7eadf'),
      this.makeOverlayText(
        80,
        308,
        'It approaches only outside your direct, unobstructed view.\nLooking at it holds it still. Furniture obstructs sight. He is not obstructed.\nThe run opens under intake observation. He begins when intake closes.\nRecover the Template Key. Leave through Exit 04.',
        '15px',
        '#c9cec0',
        20,
      ),
      this.makeOverlayText(80, 440, 'CONTROLS', '13px', '#a4aa9a'),
      this.makeOverlayText(
        80,
        464,
        'WASD / ARROWS — MOVE\nMOUSE — DIRECT VIEW\nESC — PAUSE / PARAMETERS\nR — RESTART RUN',
        '14px',
        '#a4aa9a',
        14,
      ),
      this.makeOverlayText(640, 440, 'RUN PARAMETERS', '13px', '#a4aa9a'),
      this.makeSettingsBlock(640, 464, settings, 14),
      this.makeOverlayText(80, 596, 'ENTER / CLICK — SIGN AND BEGIN', '20px', '#e0a34a'),
    ]);
  }

  showPause(settings: AccessibilitySettings): void {
    this.showOverlay([
      this.makeOverlayTitle('PAUSED', '#e7eadf', 44, 200),
      this.makeOverlayText(80, 258, 'INSPECTION SUSPENDED. THE RECORD REMAINS OPEN.', '14px', '#a4aa9a'),
      this.makeOverlayText(80, 306, 'RUN PARAMETERS', '13px', '#a4aa9a'),
      this.makeSettingsBlock(80, 336, settings, 14),
      this.makeOverlayText(80, 500, 'ESC — RESUME          R — RESTART RUN', '18px', '#e0a34a'),
    ]);
  }

  showOutcome(won: boolean, elapsedSeconds: number, escalated: boolean): void {
    const title = won ? 'ACCESS GRANTED' : 'CONTAINMENT FAILURE';
    const detail = won
      ? `FORM 27-B: FILED IN ${formatTime(elapsedSeconds)}`
      : escalated
        ? `SUBJECT RECOVERED INSIDE THE ARCHIVE.\nESCALATION ACTIVE AT TIME OF FAILURE — ${formatTime(elapsedSeconds)}`
        : `SUBJECT RECOVERED AT ${formatTime(elapsedSeconds)}`;

    this.showOverlay([
      this.makeOverlayText(GAME_WIDTH / 2, 230, title, '52px', won ? '#a4c477' : '#c45347'),
      this.makeOverlayText(GAME_WIDTH / 2, 312, detail, '17px', '#c9cec0'),
      this.makeOverlayText(GAME_WIDTH / 2, 420, won ? 'EXIT 04 LOGGED YOUR DEPARTURE.' : 'RETURN THE FORM. BEGIN AGAIN.', '14px', '#a4aa9a'),
      this.makeOverlayText(GAME_WIDTH / 2, 486, 'R — NEW RUN', '22px', '#e0a34a'),
    ]);
  }

  hideOverlay(): void {
    this.overlay?.destroy();
    this.overlay = undefined;
  }

  updateSettings(settings: AccessibilitySettings): void {
    this.settingsText.setText(this.formatSettings(settings));
    const overlay = this.overlay;
    if (overlay) {
      for (const child of overlay.list) {
        if (child instanceof Phaser.GameObjects.Text && child.name === 'settings') {
          child.setText(this.formatSettingsLines(settings));
        }
      }
    }
  }

  private showOverlay(lines: (Phaser.GameObjects.Rectangle | Phaser.GameObjects.Text)[]): void {
    this.hideOverlay();
    const backdrop = this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.void, 0.92).setDepth(50);
    this.overlay = this.scene.add.container(0, 0, [backdrop, ...lines]).setDepth(51);
  }

  private makeOverlayTitle(text: string, color: string, size: number, y: number): Phaser.GameObjects.Text {
    return this.scene.add
      .text(80, y, text, {
        color,
        fontFamily: FONT_FAMILY,
        fontSize: `${size}px`,
      })
      .setDepth(52);
  }

  private makeOverlayText(
    x: number,
    y: number,
    text: string,
    size: string,
    color: string,
    lineSpacing = 0,
  ): Phaser.GameObjects.Text {
    const created = this.scene.add
      .text(x, y, text, {
        color,
        fontFamily: FONT_FAMILY,
        fontSize: size,
      })
      .setLineSpacing(lineSpacing)
      .setDepth(52);
    if (x === GAME_WIDTH / 2) {
      created.setOrigin(0.5, 0);
    }
    return created;
  }

  private makeSettingsBlock(
    x: number,
    y: number,
    settings: AccessibilitySettings,
    lineSpacing: number,
  ): Phaser.GameObjects.Text {
    return this.makeOverlayText(x, y, this.formatSettingsLines(settings), '15px', '#c9cec0', lineSpacing).setName('settings');
  }

  private formatSettings(settings: AccessibilitySettings): string {
    return [
      `PRESSURE ${settings.pressure.toUpperCase()}`,
      `MOTION ${settings.reducedMotion ? 'REDUCED' : 'FULL'}`,
      `FLASH ${settings.flashIntensity.toUpperCase()}`,
      `FX ${settings.screenEffects ? 'ON' : 'OFF'}`,
    ].join('   ');
  }

  private formatSettingsLines(settings: AccessibilitySettings): string {
    return [
      `[1] PRESSURE: ${settings.pressure.toUpperCase()}`,
      `[2] REDUCED MOTION: ${settings.reducedMotion ? 'ON' : 'OFF'}`,
      `[3] FLASH INTENSITY: ${settings.flashIntensity.toUpperCase()}`,
      `[4] SCREEN EFFECTS: ${settings.screenEffects ? 'ON' : 'OFF'}`,
    ].join('\n');
  }
}
