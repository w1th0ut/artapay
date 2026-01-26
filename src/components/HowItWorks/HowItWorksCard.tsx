"use client";

import HowItWorksCardItem from "./HowItWorksCardItem";

import SendFeature from '@/app/assets/Send_Feature_Scan.png';
import ReceiveFeature from '@/app/assets/Receive_Feature.png';
import SwapFeature from '@/app/assets/Swap_Feature.png';
import TopupFeature from '@/app/assets/Topup_Feature.png';

const howItWorks = [
    {
        image: SendFeature.src,
        title: "Send",
        description: "Send token to anyone with any token instantly through your lens.",
        steps: [
            "Scan or input into addresses",
            "Choose your payment method",
            "Hit Pay Now button"
        ]
    },
    {
        image: ReceiveFeature.src,
        title: "Receive",
        description: "Set the amount and generate QR Code to receive token from anyone with any token.",
    },
    {
        image: SwapFeature.src,
        title: "Swap",
        description: "Set the amount and choose which stablecoin currency you want to convert your token into.",
    },
    {
        image: TopupFeature.src,
        title: "Top Up",
        description: "Set the amount and choose which stablecoin currency you want to convert your token into.",
    }
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
                    isReversed={index % 2 !== 0}
                />
            ))}
        </div>
    )
}