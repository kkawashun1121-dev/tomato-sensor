import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  TimeScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import 'chartjs-adapter-date-fns'

ChartJS.register(
  LinearScale,
  PointElement,
  LineElement,
  TimeScale,
  Title,
  Tooltip,
  Legend
)

const SENSOR_COLORS = ['#e74c3c', '#3498db', '#2ecc71']

// その株の測定履歴(平均%と、参考の3本)を時系列で表示
export default function MeasurementChart({ measurements }) {
  // 古い順に並べ替え
  const rows = [...measurements].sort(
    (a, b) => new Date(a.measured_at) - new Date(b.measured_at)
  )

  const avgData = rows.map((m) => ({ x: new Date(m.measured_at), y: m.avg_pct }))

  const sensorDatasets = [0, 1, 2].map((idx) => ({
    label: `センサー${idx} (参考)`,
    data: rows.map((m) => ({
      x: new Date(m.measured_at),
      y: m[`pct_${idx}`],
    })),
    borderColor: SENSOR_COLORS[idx],
    backgroundColor: SENSOR_COLORS[idx] + '22',
    borderWidth: 1,
    borderDash: [4, 3],
    pointRadius: 2,
    tension: 0.2,
  }))

  const data = {
    datasets: [
      {
        label: '平均 (その株の代表値)',
        data: avgData,
        borderColor: '#8e44ad',
        backgroundColor: '#8e44ad33',
        borderWidth: 3,
        pointRadius: 4,
        tension: 0.2,
      },
      ...sensorDatasets,
    ],
  }

  const options = {
    responsive: true,
    scales: {
      x: {
        type: 'time',
        time: {
          tooltipFormat: 'yyyy-MM-dd HH:mm',
          displayFormats: { hour: 'MM/dd HH:mm', day: 'MM/dd' },
        },
        title: { display: true, text: '測定日時' },
      },
      y: {
        min: 0,
        max: 100,
        title: { display: true, text: '土壌水分 (%)' },
      },
    },
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: '平均%の推移' },
    },
  }

  return <Line data={data} options={options} />
}
