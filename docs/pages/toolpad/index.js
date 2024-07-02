import * as React from 'react';
import BrandingCssVarsProvider from 'docs/src/BrandingCssVarsProvider';
import Divider from '@mui/material/Divider';
import CssBaseline from '@mui/material/CssBaseline';
import AppHeader from 'docs/src/layouts/AppHeader';
import AppFooter from 'docs/src/layouts/AppFooter';
import AppHeaderBanner from 'docs/src/components/banner/AppHeaderBanner';
import Examples from '../../src/components/landing-core/Examples';
import Hero from '../../src/components/landing-core/Hero';
import HeroVideo from '../../src/components/landing/HeroVideo';
import Features from '../../src/components/landing-core/Features';
import BuiltWith from '../../src/components/landing-core/BuiltWith';
import StudioIntro from '../../src/components/landing-core/StudioIntro';


export default function Home() {
  return (
    <BrandingCssVarsProvider>
      <CssBaseline />
      <AppHeaderBanner />
      <AppHeader gitHubRepository="https://github.com/mui/mui-toolpad" />
      <main id="main-content">
        <Hero />
        <HeroVideo />
        {/* <HeroVideo /> */}
        <Features />
        <Divider />
        <BuiltWith />
        <Divider />
        <Examples />
        <StudioIntro />
      </main>
      <AppFooter />
    </BrandingCssVarsProvider>
  );
}
