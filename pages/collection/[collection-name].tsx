import type { NextPage, GetServerSidePropsResult } from 'next';
import { tw } from 'twind';
import PostgrestInfiniteScroll from 'components/postgrest-infinite-scroll';
import NFTCard from 'components/nft-card';
import Image from 'next/image';
import { useState, useRef } from 'react';
import { useFilter, FilterState, copyFilterState } from 'hooks/useFilter';
import { useQuery } from 'hooks/useQuery';
import HeadTag from '../../components/head-tag';
import MainContainer from '../../components/layout/main-container';
import NftListHeader from '../../components/nft-list-header';

const Home: NextPage = () => {
  const { data, getQueryString, clearQueryData } = useQuery();
  const { filter } = useFilter();
  const [appliedFilter, setAppliedFilter] = useState(copyFilterState(filter));
  const fetchLimit = 20;

  const handleApplySearchQuery = (current: FilterState) => {
    const offset = data.items.length;
    const order = data.order;
    const query = getQueryString(current, offset, fetchLimit, order);
    console.info('Updated Query:', query);
    setAppliedFilter(copyFilterState(current));
    clearQueryData();
  };

  const handleOrderChange = () => {
    setAppliedFilter(copyFilterState(appliedFilter));
    clearQueryData();
  };

  return (
    <>
      <HeadTag
        title={'The Oasis'}
        url={'splyt.fi'}
        description={'Nft Rental Marketplace'}
        imageUrl={'/splyt-logo'}
      />
      <MainContainer>
        <div
          className={tw`
            w-full max-w-[1440px]
            px-[20px] mt-[66px]
          `}
        >
          <NftListHeader
            collection={{ name: 'Derby Stars', imgUrl: '/derby-logo.png' }}
            onModalApply={handleApplySearchQuery}
            onOrderChange={handleOrderChange}
          />
          <PostgrestInfiniteScroll
            appliedFilter={appliedFilter}
            fetchLimit={fetchLimit}
            className={tw`
              w-full
              grid grid-cols-auto gap-10
            `}
            onRenderItem={(item) => {
              const row = item as { [key: string]: string };
              return (
                <NFTCard
                  key={row.id}
                  name={row.name ?? ''}
                  image={row.image ?? ''}
                >
                  <NFTCardContent
                    contractAddress={row.contract_address ?? ''}
                    tokenId={row.token_id ?? ''}
                    daysMin={Number(row.days_min)}
                    daysMax={Number(row.days_max)}
                    price={Number(row.price)}
                  />
                </NFTCard>
              );
            }}
          ></PostgrestInfiniteScroll>
        </div>
      </MainContainer>
    </>
  );
};

type NFTCardContentProps = {
  contractAddress: string;
  tokenId: string;
  daysMin: number;
  daysMax: number;
  price: number;
};

function NFTCardContent({
  contractAddress,
  tokenId,
  daysMin,
  daysMax,
  price,
}: NFTCardContentProps) {
  const aRef = useRef<HTMLAnchorElement>(null);
  const handleRentButtonClick = () => {
    aRef.current?.click();
  };

  return (
    <>
      <div className={tw`w-full flex flex-row items-center px-1 py-4`}>
        <div className={tw`text-sm text-primary-700`}>Rental Period</div>
        <div className={tw`flex-1`}></div>
        <div className={tw`font-bold text-lg text-primary-700 pr-[1px]`}>
          {`${daysMin}~${daysMax}`}
        </div>
        <div className={tw`text-sm text-primary-700 relative top-[2px]`}>
          /Days
        </div>
      </div>
      <button
        className={tw`
          w-full h-12 bg-accent rounded-full flex flex-row
          justify-center items-center text-white pr-2
        `}
        onClick={handleRentButtonClick}
      >
        <a
          ref={aRef}
          className={tw`hidden`}
          href={`/${contractAddress}@${tokenId}`}
          target="_blank"
          rel="noopener noreferrer"
        ></a>
        <Image
          src="/polygon-icon.png"
          alt="polygon-icon"
          width={24}
          height={24}
        ></Image>
        <div className={tw`font-bold text-2xl pl-1 pr-[1px]`}>
          {`${Math.floor(price / 10_000_000)}`}
        </div>
        <div className={tw`font-bold text-lg relative top-[1px]`}>/Day</div>
      </button>
      <div className={tw`h-8`}></div>
    </>
  );
}

export default Home;

export function getServerSideProps(): GetServerSidePropsResult<
  Record<string, unknown>
> {
  return {
    props: {},
  };
}