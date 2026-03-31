import React, { lazy, Suspense } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

// Lazy load Chart.js and react-chartjs-2
const PieChart = lazy(() =>
  import('react-chartjs-2').then(module => {
    // Register Chart.js components when loaded
    import('chart.js').then(ChartJS => {
      ChartJS.Chart.register(
        ChartJS.ArcElement,
        ChartJS.Tooltip,
        ChartJS.Legend,
        ChartJS.CategoryScale,
        ChartJS.LinearScale,
        ChartJS.BarElement,
        ChartJS.Title
      );
    });
    return { default: module.Pie };
  })
);

export default function LazyChart({ data, options }) {
  return (
    <Suspense fallback={
      <div className="h-64 flex items-center justify-center">
        <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 text-slate-600 animate-spin" />
      </div>
    }>
      <div className="h-64 flex justify-center">
        <PieChart data={data} options={options} />
      </div>
    </Suspense>
  );
}
