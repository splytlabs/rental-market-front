/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-misused-promises */
import type {
  NextPage,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
} from 'next';
import { tw } from 'twind';
import runPostgrestQuery from 'lib/run-postgrest-query';
import Img from 'components/img';
import React, { useState } from 'react';
import { AiOutlineUser } from 'react-icons/ai';
import { MdExpandLess, MdExpandMore } from 'react-icons/md';
import { GrStatusInfo } from 'react-icons/gr';
import { BsNut, BsClock } from 'react-icons/bs';
import { BiDetail } from 'react-icons/bi';
import MainContainer from 'components/layout/main-container';
import HeadTag from 'components/head-tag';
import { useRouter } from 'next/router';
import { useMetaMask } from 'metamask-react';
import { contractFactory } from 'lib/useContract';
import { useModals } from 'hooks/useModal';
import LoginModal from 'components/modals/login-modal';
import TransactionModal from 'components/modals/transaction-modal';
import { LocalStroage } from 'lib/localStroage';

type PageProps = {
  rentalInfo: { [key: string]: string };
};

const VIEW_NAME = 'snkrz_view';

const Page: NextPage<PageProps> = ({ rentalInfo }) => {
  return (
    <>
      <HeadTag
        title={'The SPLYT Marketplace'}
        url={'splyt.fi'}
        description={'Nft Rental Marketplace'}
        imageUrl={'/splyt-logo'}
      />
      <MainContainer>
        <div
          className={tw`
            flex flex-row justify-center p-12 gap-8 flex-wrap
          `}
        >
          <LeftSide rentalInfo={rentalInfo} />
          <RightSide rentalInfo={rentalInfo} />
        </div>
      </MainContainer>
    </>
  );
};

export async function getServerSideProps(
  context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<PageProps>> {
  const key = (context.query['nft-unique-key'] ?? '') as string;
  const query = `rest/v1/${VIEW_NAME}?select=*&token_uid=eq.${key}`;
  const { items } = await runPostgrestQuery(query);
  return {
    props: { rentalInfo: (items[0] as { [key: string]: string }) ?? {} },
  };
}

export default Page;

function LeftSide({ rentalInfo }: PageProps) {
  const dummyText = `
    Lorem ipsum dolor sit amet, consectetuer adipiscing elit.
    Aenean commodo ligula eget dolor. Aenean massa.
    Cum sociis natoque penatibus et magnis dis parturient montes,
    nascetur ridiculus mus.
  `;
  const getOwnerAddress = () => {
    if (!rentalInfo.owner) {
      return '????....????';
    }
    const addr = rentalInfo.owner;
    const end = addr.length - 1;
    return `${addr.substring(0, 4)}....${addr.substring(end - 4, end)}`;
  };
  return (
    <div className={tw`w-[360px] flex flex-col gap-4`}>
      <div className={tw`flex flex-row items-center`}>
        <div className={tw`flex flex-col`}>
          <div className={tw`font-bold text-xs text-primary-900`}>SNKRZ</div>
          <div className={tw`font-bold`}>{rentalInfo.name}</div>
        </div>
        <div className={tw`flex-1 self-stretch`} />
        <div
          className={tw`
            flex flex-row justify-center items-center
            bg-primary-50 rounded-full p-2 mr-1
          `}
        >
          <AiOutlineUser />
        </div>
        <div className={tw`flex flex-col`}>
          <div className={tw`font-bold text-xs text-primary-700`}>Owner</div>
          <div className={tw`text-xs text-primary-700`}>
            {getOwnerAddress()}
          </div>
        </div>
      </div>
      <div className={tw`w-full pt-[100%] bg-white rounded-lg overflow-hidden`}>
        <Img className={tw`w-full -mt-[100%]`} src={rentalInfo.image ?? ''} />
      </div>
      <div className={tw`w-full`}>
        <Collapsible
          // prettier-ignore
          header={<><GrStatusInfo /> About </>}
        >
          {dummyText}
        </Collapsible>
        <Collapsible
          // prettier-ignore
          header={<><BsNut /> Properties </>}
        >
          {dummyText}
        </Collapsible>
        <Collapsible
          // prettier-ignore
          header={<><BsClock /> Dates </>}
        >
          {dummyText}
        </Collapsible>
        <Collapsible
          // prettier-ignore
          header={<><BiDetail /> Details </>}
        >
          {dummyText}
        </Collapsible>
      </div>
    </div>
  );
}

function RightSide({ rentalInfo }: PageProps) {
  return (
    <div className={tw`w-[360px] flex flex-col gap-4`}>
      <RentalRequestForm rentalInfo={rentalInfo} />
      <TabGroup
        startTabName="Stats"
        tabs={[
          {
            name: 'Stats',
            content: <SnkrzStatsTab rentalInfo={rentalInfo} />,
          },
          {
            name: 'Appearance',
            content: <AppearanceTab rentalInfo={rentalInfo} />,
          },
        ]}
      />
    </div>
  );
}

type CollapsibleProps = {
  header: React.ReactNode;
  children: React.ReactNode;
};

function Collapsible({ header, children }: CollapsibleProps) {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div
      className={tw`
        flex flex-col border-solid border-1 border-b-0
        first:rounded-t-lg last:rounded-b-lg last:border-b-1
      `}
    >
      <div
        className={tw`
          flex flex-row items-center p-4 hover:cursor-pointer
          font-bold text-sm gap-1
        `}
        onClick={() => setCollapsed(!collapsed)}
      >
        {header}
        <div className={tw`flex-1`}></div>
        {collapsed ? <MdExpandMore /> : <MdExpandLess />}
      </div>
      {!collapsed && (
        <div
          className={tw`
            border-solid border-t-1 bg-primary-50 p-4
            text-xs
          `}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function RentalRequestForm({ rentalInfo }: PageProps) {
  function secondToDay(sec: number) {
    return Math.round(sec / 60 / 24);
  }
  const daysMin = secondToDay(Number(rentalInfo.min_rent_duration) || 1);
  const daysMax = secondToDay(Number(rentalInfo.max_rent_duration) || 1);
  const [period, setPeriod] = useState(daysMin);
  const price = Number(rentalInfo.payment);
  const handlePeriodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value.replaceAll(/[^0-9]/g, ''));
    setPeriod(value);
  };
  const clampPeriod = () => {
    setPeriod(Math.min(Math.max(period, daysMin), daysMax));
  };

  const router = useRouter();
  const { status, ethereum, account } = useMetaMask();
  const { openModal, closeModal } = useModals();

  const rentClick = async () => {
    if (status === 'connected') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unnecessary-type-assertion
      const contract = contractFactory(ethereum as any);

      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        openModal(TransactionModal, {});

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        const tx = await contract.fulfillOrder(
          '0x255A50bB2d6b0600C1b02ad2D9f53783006bAb4D',
          rentalInfo.token_uid,
          period * 24 * 60,
          account
        );

        const data = {
          name: rentalInfo.name ?? '',
          collectionName: 'SNKRZ',
          price,
          image: rentalInfo.image ?? '',
          endAt: Math.floor(Date.now() / 1000) + period * 24 * 60 * 60,
        };

        LocalStroage.setRentedItems(data);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        await tx.wait();

        closeModal(TransactionModal);

        void router.push('/mypage');
      } catch (e) {
        console.log('error', e);
        closeModal(TransactionModal);
      }
    } else {
      openModal(LoginModal, {});
    }
  };

  return (
    <div
      className={tw`
        w-full bg-primary-50 rounded-lg
        flex flex-col p-4 gap-2
      `}
    >
      <div className={tw`font-bold text-sm text-primary-700`}>
        Rental Period
      </div>
      <div
        className={tw`
          flex flex-row items-center bg-white rounded-lg
        `}
      >
        <input
          className={tw`
            flex-1 focus:outline-none px-2
          `}
          min={rentalInfo.days_min}
          max={rentalInfo.days_max}
          step="1"
          value={period}
          onChange={handlePeriodChange}
          onBlur={clampPeriod}
        />
        <button
          className={tw`
            bg-primary-700 rounded-lg w-16 py-1 m-2 h-8
            text-white text-xs focus:outline-none
          `}
          onClick={() => setPeriod(daysMax)}
        >
          Max
        </button>
      </div>
      <div className={tw`text-xs text-primary-500`}>
        Min {daysMin} Day / Max {daysMax} Day
      </div>
      <div className={tw`flex flex-row items-center mt-6`}>
        <div className={tw`font-bold text-sm text-primary-700 mr-4`}>
          Rental Price
        </div>
        <div
          className={tw`
            flex justify-center items-center
            bg-accent rounded-full w-[18px] h-[18px] p-[3px]
          `}
        >
          <Img src="/klay-icon.svg"></Img>
        </div>
        <div className={tw`text-xs text-primary-500 ml-1`}>{price}/Day</div>
      </div>
      <div className={tw`flex flex-row items-center mb-4`}>
        <div
          className={tw`
            flex justify-center items-center
            bg-accent rounded-full w-[32px] h-[32px] p-[6px]
          `}
        >
          <Img src="/klay-icon.svg"></Img>
        </div>
        <div className={tw`font-bold text-3xl text-primary-900 ml-2`}>
          {price * period}
        </div>
      </div>
      <button
        className={tw`
          bg-accent rounded-lg h-12
          font-bold text-white text-lg focus:outline-none
        `}
        onMouseOver={clampPeriod}
        onClick={rentClick}
      >
        Rent
      </button>
    </div>
  );
}

type TabGroupProps = {
  startTabName?: string;
  tabs: { name: string; content: React.ReactNode }[];
};

function TabGroup({ startTabName, tabs }: TabGroupProps) {
  const [tabName, setTabName] = useState(startTabName ?? tabs[0]?.name ?? '');

  return (
    <div className={tw`flex flex-col gap-4`}>
      <div className={tw`flex flex-row`}>
        {tabs.map((tab) => (
          <div
            key={tab.name}
            className={tw`
              flex flex-row justify-center items-center px-4 py-2
              flex-1 font-bold text-lg truncate
              border-solid border-b-2 hover:cursor-pointer
              ${
                tab.name === tabName
                  ? 'border-primary-700 text-primary-700'
                  : 'border-primary-200 text-primary-200'
              }
            `}
            onClick={() => setTabName(tab.name)}
          >
            {tab.name}
          </div>
        ))}
      </div>
      {tabs.map((tab) =>
        tab.name !== tabName ? null : (
          <div
            key={tab.name}
            className={tw`w-full min-h-full rounded-lg overflow-hidden`}
          >
            {tab.content}
          </div>
        )
      )}
    </div>
  );
}

function SnkrzStatsTab({ rentalInfo }: PageProps) {
  const statNames = [
    'Rarity',
    'Level',
    'Fever',
    'Luck',
    'Performance',
    'Quality',
    'Tenacity',
  ];

  const getStatValue = (statName: string) => {
    const v = rentalInfo[statName] ?? '';
    return v;
  };

  return (
    <div
      className={tw`
        w-full bg-primary-50 rounded-lg flex flex-col p-4 gap-6
      `}
    >
      {statNames.map((name) => {
        return (
          rentalInfo[name] != null && (
            <div
              key={name}
              className={tw`
                flex flex-row items-center p-2 gap-1
              `}
            >
              <div className={tw`font-bold text(primary-900 lg)`}>{name}</div>
              <div className={tw`flex-1`}></div>
              <div className={tw`font-bold text(primary-700 sm)`}>
                {getStatValue(name)}
              </div>
            </div>
          )
        );
      })}
    </div>
  );
}

function AppearanceTab({ rentalInfo: _ }: PageProps) {
  return (
    <div
      className={tw`
        w-full h-[600px] bg-primary-50 rounded-lg flex flex-col p-4 gap-6
      `}
    ></div>
  );
}
