"use client";

import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Iridescent } from '@/components/Iridescent';

// Register ScrollTrigger
if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

export default function AnimatedHero() {
    const heroRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const descRef = useRef<HTMLParagraphElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const leftColumnRef = useRef<HTMLDivElement>(null);
    const rightColumnRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            // Split text into characters
            if (titleRef.current) {
                const text = titleRef.current.innerText || '';
                titleRef.current.innerHTML = text
                    .split('')
                    .map((char, i) => {
                        if (char === '\n') return '<br/>'; 
                        if (char === ' ') return '<span class="inline-block" style="width: 0.3em;">&nbsp;</span>';
                        return `<span class="inline-block char-${i}" style="opacity: 0; color: #D89B00;">${char}</span>`;
                    })
                    .join('');

                const chars = titleRef.current.querySelectorAll('span');

                // Simple reveal animation
                gsap.fromTo(
                    chars,
                    {
                        opacity: 0,
                        y: 50,
                        rotateX: -90,
                    },
                    {
                        opacity: 1,
                        y: 0,
                        rotateX: 0,
                        duration: 0.8,
                        stagger: {
                            each: 0.03,
                            from: 'start',
                        },
                        ease: 'back.out(1.7)',
                    }
                );

                // Add shimmer effect to individual chars
                chars.forEach((char) => {
                    gsap.to(char, {
                        color: '#FACC15',
                        duration: 1.5,
                        repeat: -1,
                        yoyo: true,
                        ease: 'sine.inOut',
                        delay: Math.random() * 2,
                    });
                });
            }

            // Description fade in with stagger
            if (descRef.current) {
                const text = descRef.current.innerText || '';
                descRef.current.innerHTML = text
                    .split(/(\s+)/)
                    .map(part => {
                        if (part === '\n') return '<br/>';
                        if (/\s+/.test(part)) return `<span class="inline-block" style="width: 0.3em;">&nbsp;</span>`;
                        return `<span class="inline-block mr-[0.3em]">${part}</span>`;
                    })
                    .join('');

                gsap.fromTo(
                    descRef.current.querySelectorAll('span'),
                    {
                        opacity: 0,
                        y: 20,
                        filter: 'blur(10px)',
                    },
                    {
                        opacity: 1,
                        y: 0,
                        filter: 'blur(0px)',
                        duration: 0.6,
                        stagger: 0.05,
                        delay: 1,
                        ease: 'power2.out',
                    }
                );
            }

            // Button magnetic effect and entrance
            if (buttonRef.current) {
                gsap.fromTo(
                    buttonRef.current,
                    {
                        opacity: 0,
                        scale: 0.5,
                        y: 30,
                    },
                    {
                        opacity: 1,
                        scale: 1,
                        y: 0,
                        duration: 0.8,
                        delay: 1.5,
                        ease: 'elastic.out(1, 0.5)',
                    }
                );

                // Magnetic hover effect
                const button = buttonRef.current;
                const handleMouseMove = (e: MouseEvent) => {
                    const rect = button.getBoundingClientRect();
                    const x = e.clientX - rect.left - rect.width / 2;
                    const y = e.clientY - rect.top - rect.height / 2;

                    gsap.to(button, {
                        x: x * 0.3,
                        y: y * 0.3,
                        duration: 0.3,
                        ease: 'power2.out',
                    });
                };

                const handleMouseLeave = () => {
                    gsap.to(button, {
                        x: 0,
                        y: 0,
                        duration: 0.5,
                        ease: 'elastic.out(1, 0.5)',
                    });
                };

                button.addEventListener('mousemove', handleMouseMove);
                button.addEventListener('mouseleave', handleMouseLeave);
            }

            // Scroll transition animation - black column expands, iridescent shrinks
            if (leftColumnRef.current && rightColumnRef.current && heroRef.current) {
                gsap.to(leftColumnRef.current, {
                    width: '100%',
                    ease: 'power2.inOut',
                    scrollTrigger: {
                        trigger: heroRef.current,
                        start: 'bottom bottom',
                        end: 'bottom top',
                        scrub: 1,
                    },
                });

                gsap.to(rightColumnRef.current, {
                    width: '0%',
                    opacity: 0,
                    ease: 'power2.inOut',
                    scrollTrigger: {
                        trigger: heroRef.current,
                        start: 'bottom bottom',
                        end: 'bottom top',
                        scrub: 1,
                    },
                });
            }
        }, heroRef);

        return () => ctx.revert();
    }, []);

    return (
        <section
            ref={heroRef}
            className="flex flex-col lg:flex-row h-screen relative overflow-hidden"
            style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
        >
            {/* Left Column - Hero Text (Black Container) */}
            <div
                ref={leftColumnRef}
                className="w-full lg:w-1/2 h-1/2 lg:h-screen flex flex-col justify-center items-center lg:items-start px-8 lg:px-16 relative bg-black z-10"
            >
                <h1
                    ref={titleRef}
                    className="text-5xl lg:text-7xl font-hero font-bold mb-4"
                    style={{
                        perspective: '1000px',
                        transformStyle: 'preserve-3d',
                    }}
                >
                    Gasless Payment <br/>
                    for Everyone
                </h1>

                <p
                    ref={descRef}
                    className="text-lg lg:text-xl text-white mb-8 text-center font-sans lg:text-left max-w-xl">
                    Your hero description goes here. Make it compelling and engaging.
                </p>

                <button
                    ref={buttonRef}
                    className="relative px-8 py-4 border-2 border-primary text-white font-hero font-bold text-lg overflow-hidden group"
                    style={{
                        background: 'transparent',
                        transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                        gsap.to(e.currentTarget.querySelector('.btn-bg'), {
                            scaleX: 1,
                            duration: 0.4,
                            ease: 'power2.out',
                        });
                    }}
                    onMouseLeave={(e) => {
                        gsap.to(e.currentTarget.querySelector('.btn-bg'), {
                            scaleX: 0,
                            duration: 0.4,
                            ease: 'power2.out',
                        });
                    }}
                >
                    <span
                        className="btn-bg absolute inset-0 bg-primary origin-left"
                        style={{ transform: 'scaleX(0)' }}
                    />
                    <span className="relative z-10 group-hover:text-black transition-colors duration-300">
                        Get Started
                    </span>
                </button>
            </div>

            {/* Right Column - Iridescent (Yellow/Orange Container) */}
            <div
                ref={rightColumnRef}
                className="w-full lg:w-1/2 h-1/2 lg:h-screen relative overflow-hidden"
            >
                <Iridescent color={[1, 0.6, 0.2]} mouseReact={false} />
            </div>
        </section>
    );
}
