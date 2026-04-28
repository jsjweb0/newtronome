import {MapPin} from "lucide-react";
export default function AnimalRegionFilter({regionCode, setRegionCode, regionOptions}) {

    return (
        <div className="flex items-center gap-x-3.5 mb-3 py-2 px-3">
            <label className="shrink-0 inline-flex items-center max-md:mb-3 text-stone-500 text-sm dark:text-neutral-500"
                   htmlFor="regionSelect">
                <MapPin className="shrink-0 size-4 mr-1.5" />
                지역
            </label>
            <select className="py-3 px-4 pe-9 block w-full border-gray-200 rounded-lg text-xs md:text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
                    id="regionSelect"
                    value={regionCode}
                    onChange={(e) => setRegionCode(e.target.value)}
            >
                <option value="">전체</option>
                {regionOptions.map(region => (
                    <option key={region.orgdownNm} value={region.orgdownNm}>
                        {region.orgdownNm}
                    </option>
                ))}
            </select>
        </div>
    );
}
