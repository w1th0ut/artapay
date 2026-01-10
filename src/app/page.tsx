"use client";

import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { StaggeredMenu } from '@/components/StaggeredMenu';
import { FeatureCards } from '@/components/FeatureCards';
import TechStack from '@/components/TechStack/TechStack';
import { Footer } from '@/components/Footer';
import { AnimatedHero } from '@/components/Hero';
import ScrollStack, { ScrollStackItem } from '@/components/ScrollStack';

import SendFeature from '@/assets/Send_Feature_Scan.png';
import ReceiveFeature from '@/assets/Receive_Feature.png';
import SwapFeature from '@/assets/Swap_Feature.png';

// Register ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const menuItems = [
  { label: 'Get Started', ariaLabel: 'Get Started', link: '/app' },
  { label: 'Docs', ariaLabel: 'View our documentation', link: 'https://github.com/artapay/' },
];

const socialItems = [
  { label: 'Github', link: 'https://github.com/artapay/' },
  { label: 'X', link: 'https://x.com/artapayment' },
  { label: 'Instagram', link: 'https://instagram.com' },
  { label: 'Discord', link: 'https://discord.com' }
];

export default function Home() {
  const footerContainerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    // Apply scroll snap to document body for Lenis window scroll
    document.documentElement.style.scrollSnapType = 'y proximity';
    document.documentElement.style.scrollBehavior = 'smooth';

    return () => {
      document.documentElement.style.scrollSnapType = '';
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const footerEl = footerContainerRef.current;
      if (!footerEl) return;

      ScrollTrigger.create({
        trigger: footerEl,
        start: 'top 60%',
        end: 'bottom top',
        invalidateOnRefresh: true,

        onEnter: () => {
          gsap.to(footerEl, {
            backgroundColor: '#D89B00',
            duration: 0.5,
            ease: 'power2.out',
            overwrite: 'auto'
          });
        },
        onLeaveBack: () => {
          gsap.to(footerEl, {
            backgroundColor: '#000000',
            duration: 0.5,
            ease: 'power2.out',
            overwrite: 'auto'
          });
        },
        onEnterBack: () => {
          gsap.to(footerEl, {
            backgroundColor: '#D89B00',
            duration: 0.5,
            ease: 'power2.out',
            overwrite: 'auto'
          });
        }
      });
    }, footerContainerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className='min-h-screen bg-black'>
      <StaggeredMenu
        isFixed={true}
        position="right"
        items={menuItems}
        socialItems={socialItems}
        displaySocials={true}
        displayItemNumbering={false}
        menuButtonColor="#fff"
        openMenuButtonColor="#fff"
        changeMenuColorOnOpen={false}
        colors={['#D89B00', '#E1C300']}
        logoUrl="/logo.svg"
        accentColor="#E1C300"
        onMenuOpen={() => console.log('Menu opened')}
        onMenuClose={() => console.log('Menu closed')}
      />

      {/* Hero Section */}
      <AnimatedHero />

      {/* FeatureCards */}
      <FeatureCards />

      <div
        className="w-full bg-black"
        style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
      >
        <ScrollStack
          itemDistance={150}
          itemScale={0.04}
          itemStackDistance={40}
          stackPosition="20%"
          baseScale={0.9}
          blurAmount={2}
          useWindowScroll={true}
        >
          <ScrollStackItem
            image={SendFeature.src}
            label="Send to Anyone"
            description="Send stablecoin to any recipient with scan QR or Address."
          />
          <ScrollStackItem
            image={ReceiveFeature.src}
            label="Receive from Anyone"
            description="Accept global payments with minimal fees."
          />
          <ScrollStackItem
            image={SwapFeature.src}
            label="Swap to Anything"
            description="Swap to any stablecoin you need in one step."
          />
        </ScrollStack>
      </div>

      <TechStack />

      {/* Footer Section */}
      <div
        ref={footerContainerRef}
        className="min-h-screen w-full relative"
        style={{
          backgroundColor: '#000000',
          scrollSnapAlign: 'start',
          scrollSnapStop: 'always'
        }}
      >
        <Footer />
      </div>
    </div>
  );
}
