"use client"
import { HousingSupplyResponseDto } from 'byzip-v2-sdk'
import { useSearchParams } from 'next/navigation'
import HousingListSection from '../../../global/components/HousingListSection'

const SearchingClient = ({ initialHousingData }: { initialHousingData: HousingSupplyResponseDto[] }) => {
    const searchParams = useSearchParams()
    const query = searchParams.get('query')
  // 서버에서 주입받은 원본 데이터
  const housingData = initialHousingData;
  return (
   <div className="w-full h-full bg-white flex flex-col items-center">
    <div className=' w-full'>
        <h2 className="text-xl font-bold px-6 py-4 font-pyeongchang"><span className='text-[#356EFF]'>&quot;{query}&quot;</span> 의 검색 결과</h2>
    </div>
      <div className="w-full flex-1 flex flex-col min-h-0 border-t border-[rgba(0,0,0,0.25)]">
        <HousingListSection housingData={housingData} isLoading={false} />
      </div>
    </div>
  )
}

export default SearchingClient