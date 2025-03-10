import React, { useEffect, useState } from "react"; 
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AttritionData = () => {
  const [apiResponse, setApiResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const fetchAttritionData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/Attrition Raw Data.csv");
      if (!response.ok) {
        throw new Error("Failed to fetch CSV file");
      }

      const blob = await response.blob();
      const formData = new FormData();
      formData.append("file", blob, "Attrition Raw Data.csv");

      const apiResponse = await fetch("https://attrition-shrinkage.onrender.com/attrition_tenure_category", {
        method: "POST",
        body: formData,
      });

      if (!apiResponse.ok) {
        throw new Error("Failed to process attrition data");
      }

      const responseData = await apiResponse.json();
      const parsedData = JSON.parse(responseData);
      console.log("API Response Data: ", parsedData);
      setApiResponse(parsedData);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttritionData();
  }, []);

  const handleStartDateChange = (date) => {
    setStartDate(date);
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!apiResponse || !apiResponse.data || !apiResponse.data.overall_predictions) {
    return <div>Error: Unexpected response format</div>;
  }

  const combinedData = [];
  const categories = Object.keys(apiResponse.data.overall_predictions);

  categories.forEach((category) => {
    const historicalEntries = apiResponse.data.overall_predictions[category]["Historical data"];
    const predictedEntries = apiResponse.data.overall_predictions[category]["Predicted Data"] || [];

    historicalEntries.forEach((item) => {
      combinedData.push({
        date: new Date(item.date).toLocaleDateString(),
        category: category,
        rate: parseFloat(item["Attrition Rate"]).toFixed(2),
        type: "Historical",
      });
    });

    predictedEntries.forEach((item) => {
      const formattedDate = new Date(item.date).toLocaleDateString();
      const rate = parseFloat(item["Attrition Rate"]).toFixed(2);
      combinedData.push({
        date: formattedDate,
        category: category,
        rate: rate,
        type: "Predicted",
      });
    });
  });

  const parseDDMMYYYY = (dateInput) => {
    if (dateInput instanceof Date) {
      return dateInput;
    }

    if (typeof dateInput !== "string") {
      console.error("Invalid date string:", dateInput);
      return null;
    }

    dateInput = dateInput.replace(/\//g, "-");
    const [day, month, year] = dateInput.split("-");

    if (!day || !month || !year) {
      console.error("Invalid date format:", dateInput);
      return null;
    }

    return new Date(`${year}-${month}-${day}`);
  };

  const parsedStartDate = startDate ? parseDDMMYYYY(startDate) : null;
  const parsedEndDate = endDate ? parseDDMMYYYY(endDate) : null;

  const filteredData = combinedData.filter((item) => {
    const itemDate = parseDDMMYYYY(item.date);
    return (
      (!parsedStartDate || itemDate >= parsedStartDate) &&
      (!parsedEndDate || itemDate <= parsedEndDate)
    );
  });

  const labels = [...new Set(filteredData.map((item) => item.date))];

  const historicalDatasets = categories.map((category) => ({
    type: "bar",
    label: `${category}`,
    data: labels.map((date) => {
      const entry = filteredData.find(
        (item) =>
          item.date === date && item.category === category && item.type === "Historical"
      );
      return entry ? parseFloat(entry.rate) : 0;
    }),
    backgroundColor: getColor(category, false),
    borderColor: getBorderColor(category),
    borderWidth: 1,
    stack: "Historical",
  }));

  const predictedDatasets = categories.map((category) => ({
    type: "bar",
    label: `Forecast ${category}`,
    data: labels.map((date) => {
      const entry = filteredData.find(
        (item) =>
          item.date === date && item.category === category && item.type === "Predicted"
      );
      return entry ? parseFloat(entry.rate) : 0;
    }),
    backgroundColor: getColor(category, true),
    borderColor: getBorderColor(category),
    borderWidth: 1,
    stack: "Predicted",
  }));

  const chartData = {
    labels,
    datasets: [...historicalDatasets, ...predictedDatasets],
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          boxWidth: 12,
          padding: 20,
          font: {
            size: 14,
          },
          generateLabels: function (chart) {
            return chart.data.datasets.map((dataset, i) => ({
              text: dataset.label,
              fillStyle: dataset.backgroundColor,
              hidden: !chart.isDatasetVisible(i),
              lineCap: dataset.borderCapStyle,
              lineDash: dataset.borderDash,
              lineDashOffset: dataset.borderDashOffset,
              lineJoin: dataset.borderJoinStyle,
              pointStyle: dataset.pointStyle,
              rotation: dataset.rotation,
              datasetIndex: i,
            }));
          },
        },
        onClick: function (e, legendItem, legend) {
          const index = legendItem.datasetIndex;
          const ci = legend.chart;
          const meta = ci.getDatasetMeta(index);
          meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;
          ci.update();
        },
      },
      title: {
        display: true,
        text: startDate && endDate
          ? `Attrition Rates from ${startDate.toDateString()} to ${endDate.toDateString()}`
          : "Attrition Rates Over Time",
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            let value = context.raw;
  
            if (value > 0) {
              if (label) {
                label += ': ';
              }
              label += `${value}%`;
              return label;
            }
            return null; // Skip zero values
          },
        },
        filter: function (tooltipItem) {
          return tooltipItem.raw > 0;
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        title: {
          display: true,
          text: "Date",
          color: 'rgba(0, 0, 0, 1)',
        },
        grid: {
          display: false,
          color: 'rgba(0, 0, 0, 0.2)',
        },
        ticks: {
          autoSkip: false,
          maxRotation: 90,
          minRotation: 90,
          color: 'rgba(0, 0, 0, 0.8)',
        },
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: "Attrition Percentage",
          color: 'rgba(0, 0, 0, 1)',
        },
        beginAtZero: true,
        grid: {
          display: false,
          color: 'rgba(0, 0, 0, 0.2)',
        },
        ticks: {
          color: 'rgba(0, 0, 0, 1)',
        },
      },
    },
  };
  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-transparent p-0 relative">
      <div className="absolute top-0 left-0 right-0 h-16 flex space-x-1">
        {Array.from({ length: 250 }).map((_, index) => (
          <div
            key={index}
            className="w-0.5 bg-yellow-400 h-full"
            style={{ opacity: 0.4 }}
          ></div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px",
        }}
      >
        <h2 className="text-2xl font-bold">Stacked Attrition Data</h2>
        <div style={{ display: "flex", gap: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ marginBottom: "5px", color: "#555" }}>Start Date</label>
            <DatePicker
              selected={startDate}
              onChange={handleStartDateChange}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              placeholderText="Start Date"
              className="px-2 py-1 border border-gray-300 rounded"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ marginBottom: "5px", color: "#555" }}>End Date</label>
            <DatePicker
              selected={endDate}
              onChange={handleEndDateChange}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              placeholderText="End Date"
              className="px-2 py-1 border border-gray-300 rounded"
            />
          </div>
        </div>
      </div>

      <div
        style={{
          width: "90%",
          height: "70vh",
          margin: "0 auto",
          padding: "20px",
          boxSizing: "border-box",
        }}
      >
        <Chart data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

const getColor = (category, isPredicted) => {
  const historicalColors = {
    "Tenure Category 1.0": "rgba(255, 82, 0, 0.9)",
    "Tenure Category 2.0": " rgba(78, 239, 55, 1)",
    "Tenure Category 3.0": "rgb(0,20,168)",
    "Tenure Category 4.0": "rgb(139,0,0)",
    "Tenure Category 5.0": "rgb(0,206,209)",
  };

  const predictedColors = {
    "Tenure Category 1.0": "rgba(255, 82, 0, 0.5)",
    "Tenure Category 2.0": "rgba(78, 239, 55, 0.5)",
    "Tenure Category 3.0": "rgba(0,20,168,0.5)",
    "Tenure Category 4.0": "rgba(139,0,0,0.5)",
    "Tenure Category 5.0": "rgba(0,206,209,0.5)",
  };

  return isPredicted ? predictedColors[category] : historicalColors[category];
};

const getBorderColor = (category) => {
  const borderColors = {
    "Tenure Category 1.0": "rgba(255, 82, 0, 0.9)",
    "Tenure Category 2.0": " rgba(78, 239, 55, 1)",
    "Tenure Category 3.0": "rgb(0,20,168)",
    "Tenure Category 4.0": "rgb(139,0,0)",
    "Tenure Category 5.0": "rgb(0,206,209)",
  };
  return borderColors[category];
};

export default AttritionData;
