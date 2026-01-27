"use client";

import React, { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register ScrollTrigger
if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

interface FeatureCardItemProps {
    imageDefault: string;
    imageHover: string;
    title: string;
    description: string;
    desktopStart?: string;
    desktopEnd?: string;
    mobileStart?: string;
    mobileEnd?: string;
}

export default function FeatureCardItem({
    imageDefault,
    imageHover,
    title,
    description,
    desktopStart = "top 40%",
    desktopEnd = "bottom 60%",
    mobileStart = "top 60%",
    mobileEnd = "bottom 50%"
}: FeatureCardItemProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const yellowOverlayRef = useRef<HTMLDivElement>(null);
    const hoverImageContainerRef = useRef<HTMLDivElement>(null);
    const bottomSectionRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const mm = gsap.matchMedia();

        const tl = gsap.timeline({
            paused: true,
            defaults: { duration: 0.5, ease: "power2.inOut" }
        });

        // Set up the animation sequence
        tl.to(cardRef.current, { scale: 1.02, duration: 0.3, ease: "power2.out" }, 0)
            .to(yellowOverlayRef.current, { x: 0 }, 0)
            .to(hoverImageContainerRef.current, { x: 0 }, 0)
            .to(bottomSectionRef.current, { backgroundColor: "#252525", duration: 0.3 }, 0);

        mm.add({
            isDesktop: "(min-width: 1024px)",
            isMobile: "(max-width: 1023px)"
        }, (context) => {
            const { isDesktop } = context.conditions as any;

            ScrollTrigger.create({
                trigger: cardRef.current,
                start: isDesktop ? desktopStart : mobileStart,
                end: isDesktop ? desktopEnd : mobileEnd,
                onEnter: () => tl.play(),
                onLeave: () => tl.reverse(),
                onEnterBack: () => tl.play(),
                onLeaveBack: () => tl.reverse(),
            });
        });

        return () => mm.revert();
    }, [desktopStart, desktopEnd, mobileStart, mobileEnd]);

    return (
        <div
            ref={cardRef}
            className="w-full max-w-[280px] sm:max-w-none mx-auto flex flex-col items-center justify-center bg-black-second rounded-2xl sm:rounded-4xl overflow-hidden border border-white/5 transition-transform duration-300"
        >
            {/* Top Section / Image Area */}
            <div className="relative w-full h-40 sm:h-72 lg:h-80 overflow-hidden flex items-center justify-center">

                {/* 1. Default Image Layer (Bottom) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <img
                        src={imageDefault}
                        alt={`${title} Default`}
                        className="w-16 h-16 sm:w-36 sm:h-36 lg:w-40 lg:h-40 object-contain"
                    />
                </div>

                {/* 2. Yellow Swipe Overlay Layer (Top) */}
                <div
                    ref={yellowOverlayRef}
                    className="absolute inset-0 bg-yellow-prime -translate-x-[101%] overflow-hidden z-10"
                >
                    {/* 3. Hover Image Container (Slides opposite to parent to stay centered) */}
                    <div
                        ref={hoverImageContainerRef}
                        className="absolute inset-0 flex items-center justify-center translate-x-[101%]"
                    >
                        <img
                            src={imageHover}
                            alt={`${title} Hover`}
                            className="w-16 h-16 sm:w-36 sm:h-36 lg:w-40 lg:h-40 object-contain"
                        />
                    </div>
                </div>
            </div>

            {/* Bottom Section */}
            <div
                ref={bottomSectionRef}
                className="px-4 py-4 sm:px-8 sm:py-10 lg:px-10 lg:py-10 w-full flex flex-col gap-1 sm:gap-3 text-white transition-colors duration-300 z-20"
            >
                <div className="text-base sm:text-2xl lg:text-3xl font-normal tracking-tight">
                    {title}
                </div>
                <div className="text-xs sm:text-base lg:text-lg text-white/60 leading-relaxed max-w-md font-normal">
                    {description}
                </div>
            </div>
        </div>
    );
}
