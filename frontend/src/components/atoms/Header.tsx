"use client";
import React, { useState } from "react";
import { useCardano } from "@/context/walletContext";
import WalletConnectButton from "@/components/molecules/WalletConnectButton";
import { ChooseWalletModal } from "@/components/organisms";
import { WalletInfoCard } from "@/components/molecules";
import Link from "next/link";

const Header = () => {
  const { isEnabled } = useCardano();
  const [isModalOpen, setisModalOpen] = useState(false);

  const connectWallet = () => {
    try {
      setisModalOpen(true);
    } catch (err) {
      console.log(err);
    }
  };
  return (
    <div className="flex flex-row items-center justify-between bg-top-nav-bg-color">
      <div className="ml-10 p-3">
        <img src="/sancho-black.svg" alt="Sancho logo" />
      </div>
      <div className="flex m-5 items-center text-sm font-bold font-poppins text-nowrap gap-4 md:mr-20 lg:mr-25">
        <Link href="/dreps"  className="text-orange-600">
          Home
        </Link>
        <Link href="/dreps/list">DReps table</Link>
        <Link href="#">Become a DRep</Link>
        <Link href="#">Forum</Link>
        <Link href="#">Voltaire</Link>
        <Link href="#" className="text-blue-800 font-bold">
          Create profile
        </Link>
        <div>
          {!isEnabled ? (
            <WalletConnectButton handleClick={connectWallet} />
          ) : (
            <WalletInfoCard />
          )}
          {isModalOpen && (
            <ChooseWalletModal handleClose={() => setisModalOpen(false)} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
