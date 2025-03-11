import { FC } from 'react';

interface TimeRangeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const timeRanges = [
  { id: '6h', name: 'Last 6 Hours' },
  { id: '24h', name: 'Last 24 Hours' },
  { id: '7d', name: 'Last 7 Days' },
  { id: '30d', name: 'Last 30 Days' },
];

export const TimeRangeSelector: FC<TimeRangeSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Time Range</h3>
      <div className="grid grid-cols-2 gap-2">
        {timeRanges.map((range) => (
          <button
            key={range.id}
            className={`px-3 py-2 text-sm rounded-md ${
              value === range.id
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
            }`}
            onClick={() => onChange(range.id)}
          >
            {range.name}
          </button>
        ))}
      </div>
    </div>
  );
};