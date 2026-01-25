"use client";

import HowItWorksCardItem from "./HowItWorksCardItem";

import SendFeature from '@/app/assets/Send_Feature_Scan.png';
import ReceiveFeature from '@/app/assets/Receive_Feature.png';
import SwapFeature from '@/app/assets/Swap_Feature.png';
import { StaticImageData } from 'next/image';

const howItWorks = [
    {
        image: SendFeature.src,
        title: "Send",
        description: "Send token to anyone with any token instantly through your lens.",
        marqueeTitle: "Marquee Title",
        marqueeItem: ["Item 1", "Item 2", "Item 3"]
    },
    {
        image: ReceiveFeature.src,
        title: "Receive",
        description: "Set the amount and generate QR Code to receive token from anyone with any token.",
        marqueeTitle: "Marquee Title",
        marqueeItem: ["Item 1", "Item 2", "Item 3"]
    },
    {
        image: SwapFeature.src,
        title: "Swap",
        description: "Set the amount and choose which stablecoin currency you want to convert your token into.",
        marqueeTitle: "Marquee Title",
        marqueeItem: ["Item 1", "Item 2", "Item 3"]
    },
];

export default function HowItWorksCard() {
    return (
        <div className="w-full h-auto flex flex-col gap-20">
            {howItWorks.map((item, index) => (
                <HowItWorksCardItem
                    key={index}
                    image={item.image}
                    title={item.title}
                    description={item.description}
                    marqueeTitle={item.marqueeTitle}
                    marqueeItem={item.marqueeItem}
                    isReversed={index % 2 !== 0}
                />
            ))}
        </div>
    )
}