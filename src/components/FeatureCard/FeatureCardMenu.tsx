import FeatureCard from "./FeatureCard";

export default function FeatureCardMenu() {
    return (
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 bg-black py-10 lg:py-20">
            {/* Sticky Column */}
            <div className="relative">
                <div className="sticky top-24 lg:top-32 h-fit p-8 sm:p-12 lg:p-16 w-full text-3xl sm:text-4xl lg:text-5xl font-semibold text-white text-center lg:text-left">
                    Why choose ArtaPay?
                </div>
            </div>

            {/* Feature Cards Column */}
            <div className="p-6 sm:p-12 lg:p-16">
                <FeatureCard />
            </div>
        </div>
    );
}