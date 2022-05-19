type ToolpadTargetType = 'CLOUD' | 'CE' | 'PRO';

export interface BuildEnvVars {
  TOOLPAD_TARGET: ToolpadTargetType;
}

export default {
  // We may have to resort to using `if (process.env.TARGET == 'CE') ...` everywhere to
  // get the relevant code tree shaken
  target: process.env.TOOLPAD_TARGET,
} as const;
