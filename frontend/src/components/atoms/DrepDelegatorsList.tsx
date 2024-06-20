import React from 'react';
const ViewProfileAction = () => {
  return (
    <div className="flex w-fit flex-row items-center gap-2 rounded-full text-sm bg-gray-200 px-3 py-1">
      <img src="/eye.svg" alt="View Profile" />
      <p>View Profile</p>
    </div>
  );
};
const DrepDelegatorslist = () => {
  const sampleData = [
    {
      id: 1,
      epoch: 323,
      address: '2YKJGDFD75GDCVNMIK6T90KLJJHFGHJKCFDR546778OP98FCXZ',
      balance: 100,
      votingPower: 200,
      drepSince: 123,
    },
    {
      id: 2,
      epoch: 323,
      address: '2YKJGDFD75GDCVNMIK6T90KLJJHFGHJKCFDR546778OP98FCXZ',
      balance: 100,
      votingPower: 200,
      drepSince: 123,
    },
    {
      id: 3,
      epoch: 323,
      address: '2YKJGDFD75GDCVNMIK6T90KLJJHFGHJKCFDR546778OP98FCXZ',
      balance: 100,
      votingPower: 200,
      drepSince: 123,
    },
    {
      id: 4,
      epoch: 323,
      address: '2YKJGDFD75GDCVNMIK6T90KLJJHFGHJKCFDR546778OP98FCXZ',
      balance: 100,
      votingPower: 200,
      drepSince: 123,
    },  
    {
      id: 5,
      epoch: 323,
      address: '2YKJGDFD75GDCVNMIK6T90KLJJHFGHJKCFDR546778OP98FCXZ',
      balance: 100,
      votingPower: 200,
      drepSince: 123,
    },
    {
      id: 6,
      epoch: 323,
      address: '2YKJGDFD75GDCVNMIK6T90KLJJHFGHJKCFDR546778OP98FCXZ',
      balance: 100,
      votingPower: 200,
      drepSince: 123,
    },
    {
      id: 7,
      epoch: 323,
      address: '2YKJGDFD75GDCVNMIK6T90KLJJHFGHJKCFDR546778OP98FCXZ',
      balance: 100,
      votingPower: 200,
      drepSince: 123,
    },
  ];
  return (
    <div>
      <p className="text-3xl font-bold">Delegators</p>
      {sampleData.map((delegator) => {
        return (
          <>
            <div
              key={delegator.id}
              className="flex flex-row items-center justify-between my-3"
            >
              <div className="flex flex-col ">
                <p className="font-bold">Epoch {delegator.epoch} (actual)</p>
                <p>{delegator.address}</p>
              </div>

              <div>
                <p className="font-bold">Voting Power</p>
                <p> ₳ {delegator.votingPower}</p>
              </div>

              <div>
                <p className="font-bold">Epoch</p>
                <p>
                  {' '}
                  {delegator.epoch}, Drep since {delegator.drepSince}
                </p>
              </div>

              <div>
                <p className="font-bold">Actions</p>
                <div className='flex items-center gap-2'>
                  <ViewProfileAction />
                </div>
              </div>
            </div>
            <hr />
          </>
        );
      })}
    </div>
  );
};

export default DrepDelegatorslist;