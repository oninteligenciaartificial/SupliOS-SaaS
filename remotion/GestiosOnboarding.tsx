import { Series } from 'remotion';
import { Scene1Welcome } from './scenes/Scene1Welcome';
import { Scene2Setup } from './scenes/Scene2Setup';
import { Scene3Products } from './scenes/Scene3Products';
import { Scene4POS } from './scenes/Scene4POS';
import { Scene5Reports } from './scenes/Scene5Reports';
import { Scene6CTA } from './scenes/Scene6CTA';

export const GestiosOnboarding: React.FC = () => {
  return (
    <Series>
      {/* Scene 1: Welcome (0-150 frames = 0-5s) */}
      <Series.Sequence durationInFrames={150}>
        <Scene1Welcome />
      </Series.Sequence>

      {/* Scene 2: Setup / Business type (150-600 frames = 5-20s) */}
      <Series.Sequence durationInFrames={450}>
        <Scene2Setup />
      </Series.Sequence>

      {/* Scene 3: Products / Inventory (600-1050 frames = 20-35s) */}
      <Series.Sequence durationInFrames={450}>
        <Scene3Products />
      </Series.Sequence>

      {/* Scene 4: POS (1050-1500 frames = 35-50s) */}
      <Series.Sequence durationInFrames={450}>
        <Scene4POS />
      </Series.Sequence>

      {/* Scene 5: Reports / Analytics (1500-1950 frames = 50-65s) */}
      <Series.Sequence durationInFrames={450}>
        <Scene5Reports />
      </Series.Sequence>

      {/* Scene 6: CTA (1950-2700 frames = 65-90s) */}
      <Series.Sequence durationInFrames={750}>
        <Scene6CTA />
      </Series.Sequence>
    </Series>
  );
};
