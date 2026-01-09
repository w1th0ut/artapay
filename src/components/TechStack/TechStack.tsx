'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface TechItem {
    name: string;
    icon: string;
}

const techStack: TechItem[] = [
    { name: 'Foundry', icon: '/icons/Foundry.svg' },
    { name: 'Gelato', icon: '/icons/Gelato.svg' },
    { name: 'Lisk', icon: '/icons/Lisk.svg' },
    { name: 'Wagmi', icon: '/icons/Wagmi.svg' },
    { name: 'Viem', icon: '/icons/Viem.svg' },
    { name: 'Privy', icon: '/icons/Privy.svg' },
];

const containerVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: (index: number) => ({
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.5,
            delay: index * 0.1,
            ease: 'easeOut',
        },
    }),
};

const backgroundSlideVariants = {
    initial: {
        scaleX: 0,
    },
    animate: {
        scaleX: 0,
    },
    hover: {
        scaleX: 1,
        transition: {
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
        }
    }
};

const iconVariants = {
    initial: { scale: 1 },
    hover: {
        scale: 1.1,
        transition: { duration: 0.3 }
    }
};

const textVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 0, y: 10 },
    hover: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3, delay: 0.1 }
    }
};

export default function TechStack() {
    return (
        <section
            className="w-full min-h-screen bg-black flex flex-col items-center justify-center px-4 py-16"
            style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
        >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-16 text-center tracking-wider font-hero text-primary">
                Integrated With
            </h1>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-0 max-w-5xl w-full">
                {techStack.map((tech, index) => {
                    const isNotLastInRow = (index + 1) % 3 !== 0;
                    const isNotLastRow = index < 3;

                    return (
                        <motion.div
                            key={tech.name}
                            variants={containerVariants}
                            initial="initial"
                            animate="animate"
                            whileHover="hover"
                            custom={index}
                            className={`
                                group relative aspect-square flex flex-col items-center justify-center cursor-pointer overflow-hidden
                                
                            `}
                        >
                            {/* Sliding background effect */}
                            <motion.div
                                variants={backgroundSlideVariants}
                                className="absolute inset-0 origin-left"
                                style={{ transformOrigin: 'left', backgroundColor: '#D89B00' }}
                            />

                            {/* Icon container */}
                            <motion.div
                                variants={iconVariants}
                                className="relative z-10 w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40"
                            >
                                <Image
                                    src={tech.icon}
                                    alt={tech.name}
                                    fill
                                    className="object-contain p-4 transition-all duration-300"
                                    sizes="(max-width: 768px) 50vw, 33vw"
                                />
                            </motion.div>

                            {/* Label that appears on hover */}
                            <motion.span
                                variants={textVariants}
                                className="relative z-10 font-hero text-black text-lg md:text-xl lg:text-2xl font-semibold mt-2"
                            >
                                {tech.name}
                            </motion.span>
                        </motion.div>
                    );
                })}
            </div>
        </section>
    );
}
