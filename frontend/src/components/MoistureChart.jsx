import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  TimeScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import 'chartjs-adapter-date-fns'

// Chart.js のコンポーネントを登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  TimeScale,
  Title,
  Tooltip,
  Legend
)

const COLORS = ['#e74c3c', '#3498db', '#2ecc71']

export default function MoistureChart({ readings }) {
  // sensor_index ごとにデータを分ける
  const datasets = [0, 1, 2].map((idx) => {
    const filtered = readings
      .filter((r) => r.sensor_index === idx)
      .sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at))

    return {
      label: `Sensor ${idx}`,
      data: filtered.map((r) => ({
        x: new Date(r.recorded_at),
        y: r.moisture_pct,
      })),
      borderColor: COLORS[idx],
      backgroundColor: COLORS[idx] + '33',
      tension: 0.2,
    }
  })

  const data = { datasets }

  const options = {
    responsive: true,
    scales: {
      x: {
        type: 'time',
        time: {
          tooltipFormat: 'yyyy-MM-dd HH:mm',
          displayFormats: {
            hour: 'HH:mm',
            day: 'MM/dd',
          },
        },
        title: { display: true, text: '時刻' },
      },
      y: {
        min: 0,
        max: 100,
        title: { display: true, text: '土壌水分 (%)' },
      },
    },
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: '土壌水分量の推移' },
    },
  }

  return <Line data={data} options={options} />
}