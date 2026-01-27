"use client";

import Image from "next/image";
import { Marquee } from "@/components/ui/marquee";
import howItWorksBg from "@/assets/how-it-works-bg.png"

interface HowItWorksCardItemProps {
    image: string;
    title: string;
    description: string;
    isReversed?: boolean;
    steps?: string[];
}

export default function HowItWorksCardItem({
    image,
    title,
    description,
    isReversed,
    steps
}: HowItWorksCardItemProps) {
    return (
        <div className={`flex flex-col lg:flex-row w-full h-fit rounded-[2rem] sm:rounded-4xl overflow-hidden border border-white/10 ${isReversed ? "lg:flex-row-reverse" : ""}`}>
            {/* Image Section */}
            <div className="relative bg-black-third flex items-center justify-center overflow-hidden w-full lg:w-1/2 aspect-square lg:aspect-auto">
                <Image src={howItWorksBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <Image src={image} alt={title} width={500} height={500} className="relative z-10 w-full h-full object-contain p-8 sm:p-12 lg:p-16" />
            </div>

            {/* Content Section */}
            <div className="bg-black-second flex flex-col w-full lg:w-1/2 h-auto px-6 sm:px-12 lg:px-20 py-10 lg:py-16 justify-center gap-6 text-white text-center lg:text-left transition-all duration-300">
                <div className="flex flex-col gap-4">
                    <span className="text-xl sm:text-2xl lg:text-3xl font-semibold">{title}</span>
                    <span className="text-base sm:text-lg text-white/60 leading-relaxed">{description}</span>

                    {steps && steps.length > 0 && (
                        <ol className="list-decimal list-inside text-sm sm:text-base text-white/60 space-y-2 ml-1 mt-4 text-left mx-auto lg:mx-0 max-w-md">
                            {steps.map((step, idx) => (
                                <li key={idx} className="pl-1">{step}</li>
                            ))}
                        </ol>
                    )}
                </div>
            </div>
        </div>
    )
}