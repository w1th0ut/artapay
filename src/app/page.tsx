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
  { label: 'Connect Wallet', ariaLabel: 'Connect wallet', link: '/start' },
  { label: 'Docs', ariaLabel: 'View our documentation', link: 'https://github.com/artapay/' },
];

const socialItems = [
  { label: 'Github', link: 'https://github.com/artapay/' },
  { label: 'X', link: 'https://x.com' },
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
        // REVISI LOGIKA:
        // 'top center' -> Mulai animasi saat BAGIAN ATAS footer menyentuh TENGAH layar
        // Anda bisa ganti 'top 80%' jika ingin berubah lebih cepat saat baru muncul sedikit
        start: 'top 60%',
        end: 'bottom top', // Selesai saat bagian bawah footer menyentuh bagian atas layar

        // Mencegah animasi berjalan ulang saat refresh jika user sudah di bawah
        // GSAP akan mengkalkulasi ulang saat refresh
        invalidateOnRefresh: true,

        onEnter: () => {
          gsap.to(footerEl, {
            backgroundColor: '#D89B00',
            duration: 0.5,
            ease: 'power2.out',
            overwrite: 'auto' // Mencegah konflik animasi
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
        // Opsional: Handle jika user scroll cepat ke atas melewati footer
        onEnterBack: () => {
          gsap.to(footerEl, {
            backgroundColor: '#D89B00',
            duration: 0.5,
            ease: 'power2.out',
            overwrite: 'auto'
          });
        }
      });
    }, footerContainerRef); // Scope context ke ref ini

    return () => ctx.revert();
  }, []);

  return (
    <div
      className='min-h-screen bg-black'
    >
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

      {/* Hero Section - Ini yang akan terlihat pertama kali */}
      <AnimatedHero />

      {/* FeatureCards akan muncul setelah user scroll melewati hero */}
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
            description="Lorem ipsum dolor sit amet"
          >
          </ScrollStackItem>
          <ScrollStackItem
            image={ReceiveFeature.src}
            label="Receive from Anyone"
            description="Lorem ipsum dolor sit amet"
          >
          </ScrollStackItem>

          <ScrollStackItem
            image={SwapFeature.src}
            label="Swap to Anything"
            description="Lorem ipsum dolor sit amet"
          >
          </ScrollStackItem>
        </ScrollStack>
      </div>

      <TechStack />

      {/* Footer Section with scroll-triggered background transition */}
      <div
        ref={footerContainerRef}
        className="min-h-screen w-full relative" // Tambahkan relative & w-full untuk safety layout
        style={{
          backgroundColor: '#000000',
          scrollSnapAlign: 'start',
          scrollSnapStop: 'always'
        }} // Set default inline style
      >
        <Footer />
      </div>
    </div>
  );
}