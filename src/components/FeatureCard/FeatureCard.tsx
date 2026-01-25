"use client";

import React from "react";
import FeatureCardItem from "./FeatureCardItem";

const features = [
    {
        title: "QR Payment",
        description: "Just scan and send or generate and receive",
        imageDefault: "/qr-default.svg",
        imageHover: "/qr-hover.svg",
    },
    {
        title: "Auto-Swap Engine",
        description: "Your tokens, your choice. We handle the conversion",
        imageDefault: "/swap-default.svg",
        imageHover: "/swap-hover.svg",
    },
    {
        title: "Gasless Transactions",
        description: "Pay gas fees directly with stablecoins. No ETH required.",
        imageDefault: "/gasless-default.svg",
        imageHover: "/gasless-hover.svg",
    }
];

export default function FeatureCard() {
    return (
        <div className="flex flex-col gap-16 w-full">
            {features.map((feature, index) => (
                <FeatureCardItem
                    key={index}
                    title={feature.title}
                    description={feature.description}
                    imageDefault={feature.imageDefault}
                    imageHover={feature.imageHover}
                />
            ))}
        </div>
    );
}