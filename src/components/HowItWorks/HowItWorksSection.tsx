"use client";

import HowItWorksCard from "./HowItWorksCard";

export default function HowItWorksSection() {
    return (
        <div className="w-full h-auto flex justify-center">
            <div className="w-full max-w-7xl px-4 sm:px-8 lg:px-12 gap-16 flex flex-col items-center">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-normal text-white text-center">How It Works</h2>
                <HowItWorksCard />
            </div>
        </div>
    )
}