import FeatureCard from "./FeatureCard";

export default function FeatureCardMenu() {
    return (
        <div className="w-full h-auto grid grid-cols-2">
            <div className=" p-16">
                <div className="w-full flex items-start text-5xl font-semibold sticky top-1/2">
                    Why choose ArtaPay?
                </div>
            </div>
            <div className=" p-16">
                <FeatureCard />
            </div>
        </div>
    );
}