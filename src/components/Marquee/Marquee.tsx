import { MarqueeItem } from "./MarqueeItem";
import CoinMarqueeCard from "./CoinMarqueeCard";

// Data untuk supported coins
const supportedCoins = [
    { icon: "/icons/chnt.svg", name: "CHNT" },
    { icon: "/icons/cnht.svg", name: "CNHT" },
    { icon: "/icons/eurc.svg", name: "EURC" },
    { icon: "/icons/euroc.svg", name: "EUROC" },
    { icon: "/icons/idrx.svg", name: "IDRX" },
    { icon: "/icons/jpyc.svg", name: "JPYC" },
    { icon: "/icons/mxnt.svg", name: "MXNT" },
    { icon: "/icons/usdc.svg", name: "USDC" },
    { icon: "/icons/usdt.svg", name: "USDT" },
];

export function SupportedCoinsMarquee() {
    return (
        <div className="w-full h-auto flex justify-center py-16 md:py-32">
            <div className="w-full max-w-7xl flex flex-col items-center gap-12">
                {/* Title Section */}
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-thin text-white text-center">
                    Supported Coins
                </h2>

                {/* Marquee Section */}
                <MarqueeItem pauseOnHover className="[--duration:30s]">
                    {supportedCoins.map((coin, index) => (
                        <CoinMarqueeCard
                            key={index}
                            icon={coin.icon}
                            name={coin.name}
                        />
                    ))}
                </MarqueeItem>
            </div>
        </div>
    );
}