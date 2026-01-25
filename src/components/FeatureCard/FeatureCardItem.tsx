"use client";

import React, { useRef } from "react";
import gsap from "gsap";

interface FeatureCardItemProps {
    imageDefault: string;
    imageHover: string;
    title: string;
    description: string;
}

export default function FeatureCardItem({
    imageDefault,
    imageHover,
    title,
    description
}: FeatureCardItemProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const yellowOverlayRef = useRef<HTMLDivElement>(null);
    const hoverImageContainerRef = useRef<HTMLDivElement>(null);
    const bottomSectionRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
        gsap.to(cardRef.current, { scale: 1.02, duration: 0.3, ease: "power2.out" });

        // Swipe Yellow Overlay from left (-100% to 0)
        gsap.to(yellowOverlayRef.current, { x: 0, duration: 0.5, ease: "power2.inOut" });

        // Counter-swipe Hover Image Container (100% to 0 relative to parent)
        // This keeps the hover image perfectly centered while the mask slides over it
        gsap.to(hoverImageContainerRef.current, { x: 0, duration: 0.5, ease: "power2.inOut" });

        gsap.to(bottomSectionRef.current, { backgroundColor: "#252525", duration: 0.3 });
    };

    const handleMouseLeave = () => {
        gsap.to(cardRef.current, { scale: 1, duration: 0.3, ease: "power2.out" });

        gsap.to(yellowOverlayRef.current, { x: "-100%", duration: 0.5, ease: "power2.inOut" });
        gsap.to(hoverImageContainerRef.current, { x: "100%", duration: 0.5, ease: "power2.inOut" });

        gsap.to(bottomSectionRef.current, { backgroundColor: "transparent", duration: 0.3 });
    };

    return (
        <div
            ref={cardRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="w-full flex flex-col items-center justify-center bg-black-second rounded-4xl overflow-hidden cursor-pointer"
        >
            {/* Top Section / Image Area */}
            <div className="relative w-full h-80 overflow-hidden flex items-center justify-center">

                {/* 1. Default Image Layer (Bottom) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <img
                        src={imageDefault}
                        alt={`${title} Default`}
                        className="w-40 h-40 object-contain"
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
                            className="w-40 h-40 object-contain"
                        />
                    </div>
                </div>
            </div>

            {/* Bottom Section */}
            <div
                ref={bottomSectionRef}
                className="px-10 py-10 w-full flex flex-col gap-3 text-white transition-colors duration-300 z-20"
            >
                <div className="text-4xl font-bold tracking-tight">
                    {title}
                </div>
                <div className="text-xl text-white/70 leading-relaxed max-w-md">
                    {description}
                </div>
            </div>
        </div>
    );
}
