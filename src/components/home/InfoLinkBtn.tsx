'use client';

import React from 'react';

const InfoLinkBtn = () => {
  return (
    // <div className="flex flex-row md:justify-end items-center gap-2.5 text-xs">
    <div className="flex flex-row justify-end items-center gap-2.5 text-xs">

      <div className="flex justify-center items-center bg-[#e5edff] rounded-md px-3 py-1.5 gap-2.5">
        <a
          target="_blank"
          rel="noreferrer"
          href="https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancListView.do"
          className="no-underline text-[#356eff] font-semibold leading-4 text-center"
        >
          청약경쟁률 확인
        </a>
      </div>

      <div className="flex justify-center items-center bg-[#e5edff] rounded-md px-3 py-1.5 gap-2.5">
        <a
          target="_blank"
          rel="noreferrer"
          href="https://www.applyhome.co.kr/wa/waa/selectAptPrzwinDescList.do"
          className="no-underline text-[#356eff] font-semibold leading-4 text-center"
        >
          청약당첨자 확인
        </a>
      </div>
    </div>
  );
};

export default InfoLinkBtn;
