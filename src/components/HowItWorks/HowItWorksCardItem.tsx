"use client";

import { Marquee } from "@/components/ui/marquee";

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
            <div className={`bg-black-third flex items-center justify-center overflow-hidden ${isReversed ? "order-last" : ""}`}>
                <img src={image} alt={title} className="w-full h-full object-cover" />
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
                                <span key={index}>{item}</span>
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