import React, { useEffect, useState } from "react";
import { useCardano } from "@/context/walletContext";
import WalletConnectButton from "@/components/molecules/WalletConnectButton";
import { WalletInfoCard } from "@/components/molecules";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDRepContext } from "@/context/drepContext";

const Header = () => {
  const { isEnabled } = useCardano();
  const { currentLocale } = useDRepContext();
  const pathname = usePathname();
  const [activeLink, setActiveLink] = useState(null);

  useEffect(() => {
    // Setting the active link based on the current pathname
    setActiveLink(pathname);
  }, [pathname]);

  return (
    <header className="bg-white">
      <div className="container flex flex-row py-6 items-center justify-between">
        <div className="">
          <img src="/sancho-black.svg" alt="Sancho logo" />
        </div>
        <div className="flex items-center text-sm font-bold text-nowrap gap-6">
          <Link
            href="/dreps"
            className={activeLink === `/${currentLocale}/dreps` ? "text-orange-500" : ""}
          >
            What are DReps
          </Link>
          <Link
            href="/dreps/list"
            className={activeLink === `/${currentLocale}/dreps/list` ? "text-orange-500" : ""}
          >
            DRep List
          </Link>
          <Link
            href="/dreps/notes"
            className={activeLink === `/${currentLocale}/dreps/notes` ? "text-orange-500" : ""}
          >
            Notes
          </Link>
          <Link href="#">Ecosystem</Link>
          <div>{!isEnabled ? <WalletConnectButton test_name={'header'} /> : <WalletInfoCard />}</div>
          <div className="cursor-pointer">
            <img src="/bell.svg" alt="Notifs" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
