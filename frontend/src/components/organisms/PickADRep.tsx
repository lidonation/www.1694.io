"use client";
import React from "react";
import ViewDRepTableBtn from "../molecules/ViewDRepTableButton";
import {useRouter} from "next/navigation";

const PickADRep = () => {
    const router = useRouter();
    const navToDRepList = () => {
        router.push("/dreps/list");
    };

    return (
        <div className="shadow-lg z-10 py-10">
            <div className="container grid grid-cols-2 gap-4">
                <div className="col-span-1 flex flex-col items-start justify-center gap-3 py-20">
                    <div className="font-bold text-6xl">
                        <p>How can I</p>
                        <p>pick a DRep</p>
                    </div>

                    <p>
                        In order to participate in governance, a stake credential must be
                        delegated to a DRep. Ada holders will generally delegate their voting
                        rights to a registered DRep that will vote on their behalf.
                    </p>

                    <ViewDRepTableBtn handleClick={navToDRepList}/>
                </div>

                <div className="col-span-1 flex flex-col items-center justify-center">
                    <img
                        src="/img/handscuppingcoin.png"
                        alt="Pick a DRep img"
                        width={"500px"}
                    />
                </div>
            </div>
        </div>
    );
};

export default PickADRep;
