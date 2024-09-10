import moment from "moment";
import Head from "next/head";
import Img from "next/image";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useState } from "react";
import Web3 from "web3";
import dynamic from 'next/dynamic';  // Import dynamic from next/dynamic
import Navbar from "../../components/Navbar";
import { useData } from "../../contexts/DataContext";

// Dynamically import ChartContainer component with SSR disabled
const ChartContainer = dynamic(() => import('../../components/Chart/ChartContainer'), { ssr: false });

export interface MarketProps {
  id: string;
  title: string;
  imageHash: string;
  totalAmount: number;
  totalYes: number;
  totalNo: number;
  description: string;
  endTimestamp: number;
  resolverUrl: string;
}

const Details = () => {
  const router = useRouter();
  const { id } = router.query;
  const { polymarket, account, loadWeb3, loading, polyToken } = useData();
  const [market, setMarket] = useState<MarketProps | undefined>(undefined);
  const [selected, setSelected] = useState<string>("YES");
  const [dataLoading, setDataLoading] = useState(true);
  const [button, setButton] = useState<string>("Trade");

  const [input, setInput] = useState("");

  const getMarketData = useCallback(async () => {
    if (polymarket && account) {
      var data = await polymarket.methods.questions(id).call({ from: account });
      setMarket({
        id: data.id,
        title: data.question,
        imageHash: data.creatorImageHash,
        totalAmount: parseInt(data.totalAmount),
        totalYes: parseInt(data.totalYesAmount),
        totalNo: parseInt(data.totalNoAmount),
        description: data.description,
        endTimestamp: parseInt(data.endTimestamp),
        resolverUrl: data.resolverUrl,
      });
      setDataLoading(false);
    }
  }, [account, id, polymarket]);

  const handleTrade = async () => {
    if (polyToken && account && market) {
      var bal = await polyToken.methods.balanceOf(account).call();
      setButton("Please wait");

      if (input && selected === "YES") {
        if (parseInt(input) < parseInt(Web3.utils.fromWei(bal, "ether"))) {
          await polyToken.methods
            .approve(polymarket._address, Web3.utils.toWei(input, "ether"))
            .send({ from: account });
          await polymarket.methods
            .addYesBet(id, Web3.utils.toWei(input, "ether"))
            .send({ from: account });
        }
      } else if (input && selected === "NO") {
        if (parseInt(input) < parseInt(Web3.utils.fromWei(bal, "ether"))) {
          await polyToken.methods
            .approve(polymarket._address, Web3.utils.toWei(input, "ether"))
            .send({ from: account });
          await polymarket.methods
            .addNoBet(id, Web3.utils.toWei(input, "ether"))
            .send({ from: account });
        }
      }
      await getMarketData();
      setButton("Trade");
    }
  };

  useEffect(() => {
    loadWeb3().then(() => {
      if (!loading) getMarketData();
    });
  }, [loading, getMarketData]);

  return (
    <div className="flex flex-col justify-center items-center h-full">
      <Head>
        <title>Polymarket</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Navbar />
      <main className="w-full flex flex-col sm:flex-row py-4 max-w-5xl">
        {dataLoading ? (
          <div className="flex flex-col justify-center items-center h-full w-full pt-10">
            <div className="text-center">
              <div className="text-3xl font-bold">Loading...</div>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col pt-1">
            <div className="p-6 rounded-lg flex flex-row justify-start border border-gray-300">
              <div className="flex flex-row">
                <div className="h-w-15 pr-4">
                  <Img
                    src={`https://ipfs.infura.io/ipfs/${market?.imageHash}`}
                    className="rounded-full"
                    width={55}
                    height={55}
                  />
                </div>
                <div className="flex flex-col justify-start w-1/2 space-y-1">
                  <span className="text-xs font-light text-gray-500 whitespace-nowrap">
                    US currency affairs
                  </span>
                  <span className="text-lg font-semibold whitespace-nowrap">
                    {market?.title}
                  </span>
                </div>
              </div>
              <div className="flex flex-row items-center space-x-4 ml-3">
                <div className="flex flex-col justify-start bg-gray-100 p-3">
                  <span className="text-xs font-light text-gray-500 whitespace-nowrap">
                    Market End on
                  </span>
                  <span className="text-base font-semibold text-black whitespace-nowrap">
                    {market?.endTimestamp
                      ? moment(market.endTimestamp).format("MMMM D, YYYY")
                      : "N/A"}
                  </span>
                </div>
                <div className="flex flex-col justify-start bg-gray-100 p-3">
                  <span className="text-xs font-light text-gray-500 whitespace-nowrap">
                    Total Volume
                  </span>
                  <span className="text-base font-semibold text-black whitespace-nowrap">
                    {Web3.utils.fromWei(market?.totalAmount.toString() ?? "0", "ether")} POLY
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col space-y-3">
              <div className="w-full flex flex-row mt-5">
                <div className="w-2/3 border rounded-lg p-1 pb-4 border-gray-300 mr-2">
                  <ChartContainer questionId={market?.id ?? "0"} />
                </div>
                <div className="w-1/3 rounded-lg border border-gray-300 ml-2">
                  <div className="flex flex-col items-start p-6">
                    <span className="text-lg font-bold m-auto pb-2">Buy</span>
                    <hr className="text-black w-full py-2" />
                    <span className="text-base">Pick Outcome</span>
                    <div
                      className={`w-full py-2 px-2 ${
                        selected === "YES" ? "bg-green-500 text-white" : "bg-gray-100"
                      } mt-2 cursor-pointer`}
                      onClick={() => setSelected("YES")}
                    >
                      <span className="font-bold">YES</span>{" "}
                      {!market?.totalAmount
                        ? `0`
                        : ((market?.totalYes * 100) / market?.totalAmount).toFixed(2)}%
                    </div>
                    <div
                      className={`w-full py-2 px-2 ${
                        selected === "NO" ? "bg-green-500 text-white" : "bg-gray-100"
                      } mt-2 cursor-pointer`}
                      onClick={() => setSelected("NO")}
                    >
                      <span className="font-bold">No</span>{" "}
                      {!market?.totalAmount
                        ? `0`
                        : ((market?.totalNo * 100) / market?.totalAmount).toFixed(2)}%
                    </div>
                    <span className="text-sm mt-5 mb-4">How much?</span>
                    <div className="w-full border border-gray-300 flex flex-row items-center">
                      <input
                        type="search"
                        name="q"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="w-full py-2 px-2 text-base text-gray-700 border-gray-300 rounded-md focus:outline-none"
                        placeholder="0"
                        autoComplete="off"
                      />
                      <span className="whitespace-nowrap text-sm font-semibold">
                        POLY |{" "}
                      </span>
                      <span className="text-sm font-semibold text-blue-700 mx-2 underline cursor-pointer">
                        Max
                      </span>
                    </div>
                    <button
                      className="mt-5 rounded-lg py-3 text-center w-full bg-blue-700 text-white"
                      onClick={handleTrade}
                      disabled={button !== "Trade"}
                    >
                      {button}
                    </button>
                  </div>
                </div>
              </div>
              <div className="w-2/3 flex flex-col">
                <span className="text-base font-semibold py-3">
                  Description
                </span>
                <span>{market?.description}</span>
                <span className="text-base my-3 py-2 bg-gray-100 rounded-xl px-3">
                  Resolution Source :{" "}
                  <a className="text-blue-700" href={market?.resolverUrl}>
                    {market?.resolverUrl}
                  </a>
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Details;