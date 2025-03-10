import React, { useEffect, useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const OutputVisualization = () => {
  const [visualizationData, setVisualizationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch the forecast data from the API
    const fetchData = async () => {
      setLoading(true); // Set loading state to true before fetching
      try {
        const response = await fetch("http://127.0.0.1:5000/forecast");
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();

        // Format the data for Line and Bar charts
        const lineChartData = {
          labels: data.DailyForecast ? data.DailyForecast.map(forecast => forecast.Date) : [],
          datasets: [{
            label: 'Volume',
            data: data.DailyForecast ? data.DailyForecast.map(forecast => forecast.Volume) : [],
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
          }]
        };

        const barChartData = {
          labels: data.DailyForecast ? data.DailyForecast.map(forecast => forecast.Date) : [],
          datasets: [{
            label: 'Volume Percentage',
            data: data.DailyForecast ? data.DailyForecast.map(forecast => forecast.VolumePercentage) : [],
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1,
          }]
        };

        setVisualizationData({ lineChartData, barChartData });
      } catch (error) {
        console.error("Failed to fetch forecast data", error);
        setError(error.message);
      } finally {
        setLoading(false); // Set loading state to false after fetch completes
      }
    };

    fetchData();
  }, []); // Empty dependency array ensures the effect runs only once

  return (
    <div className="container mx-auto px-6 py-12">
      <header className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-800">Forecast Results Visualization</h1>
      </header>

      {loading ? (
        <p className="text-center text-gray-600">Loading...</p>
      ) : error ? (
        <p className="text-center text-red-600">{error}</p>
      ) : visualizationData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Line Chart for Daily Forecast Volume */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Daily Forecast Volume
            </h3>
            <Line
              data={visualizationData.lineChartData}
              options={{ responsive: true }}
            />
          </div>

          {/* Bar Chart for Volume Percentage */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Volume Percentage
            </h3>
            <Bar
              data={visualizationData.barChartData}
              options={{ responsive: true }}
            />
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-600">No data available for visualization.</p>
      )}
    </div>
  );
};

export default OutputVisualization;
