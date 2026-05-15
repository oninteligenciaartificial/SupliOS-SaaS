import { Composition } from 'remotion';
import { GestiosOnboarding } from './GestiosOnboarding';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="GestiosOnboarding"
    component={GestiosOnboarding}
    durationInFrames={2700}
    fps={30}
    width={1280}
    height={720}
  />
);
