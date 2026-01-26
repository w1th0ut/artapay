import FeatureCard from "./FeatureCard";

export default function FeatureCardMenu() {
    return (
        <div className="w-full h-auto grid grid-cols-1 lg:grid-cols-2 bg-black py-10 lg:py-20 lg:items-start">
            <div className="p-8 sm:p-12 lg:p-16 h-full">
                <div className="w-full text-3xl sm:text-4xl lg:text-5xl font-semibold lg:sticky lg:top-40 text-white text-center lg:text-left z-20">
                    Why choose ArtaPay?
                </div>
            </div>
            <div className="p-6 sm:p-12 lg:p-16">
                <FeatureCard />
            </div>
        </div>
    );
}