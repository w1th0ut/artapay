"use client";

import Image from "next/image";
import { Marquee } from "@/components/ui/marquee";
import howItWorksBg from "@/app/assets/how-it-works-bg.png"

interface HowItWorksCardItemProps {
    image: string;
    title: string;
    description: string;
    marqueeTitle: string;
    marqueeItem: string[];
    isReversed?: boolean;
}

export default function HowItWorksCardItem({
    image,
    title,
    description,
    marqueeTitle,
    marqueeItem,
    isReversed
}: HowItWorksCardItemProps) {
    return (
        <div className="grid grid-cols-2 w-full h-fit rounded-4xl overflow-hidden border border-white/10">
            {/* Image Section */}
            <div className={`relative bg-black-third flex items-center justify-center overflow-hidden ${isReversed ? "order-last" : ""}`}>
                <Image src={howItWorksBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <Image src={image} alt={title} width={500} height={500} className="relative z-10 w-full h-full object-contain p-12" />
            </div>

            {/* Content Section */}
            <div className="bg-black-second flex flex-col w-full h-full px-20 justify-center gap-6 text-white">
                <div className="flex flex-col gap-4">
                    <span className="text-2xl font-semibold">{title}</span>
                    <span className="text-lg text-white/60">{description}</span>
                </div>
                <div className="flex flex-col gap-4">
                    <span className="text-xl font-medium">{marqueeTitle}</span>

                    <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
                        <Marquee reverse pauseOnHover className="[--duration:20s] text-lg text-white/60">
                            {marqueeItem.map((item, index) => (
                                <span key={index} className="bg-black-third p-2 rounded-md">{item}</span>
                            ))}
                        </Marquee>
                    </div>

                </div>
                <div>

                </div>
            </div>
        </div>
    )
}