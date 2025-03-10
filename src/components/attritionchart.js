
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
  const [startDate, setStartDate] = useState(new Date('2024-01-01')); // Default to January 1, 2024
  const [endDate, setEndDate] = useState(new Date('2024-12-31'));  
  const [dateError, setDateError] = useState(""); 

  const fetchAttritionData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/attrition_data.xlsx");
      if (!response.ok) {
        throw new Error("Failed to fetch Excel file");
      }
      const blob = await response.blob();
      const formData = new FormData();
      formData.append("file", blob, "attrition_data.xlsx");

      const apiResponse = await fetch("https://attrition-shrinkage.onrender.com/get_attrition_data", {
        method: "POST",
        body: formData,
      });

      if (!apiResponse.ok) {
        throw new Error("Failed to process attrition data");
      }

      const responseData = await apiResponse.json();
      const parsedData = JSON.parse(responseData);
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

  // Filter the data by selected start and end dates
  const filterDataByDate = (data) => {
    if (!startDate || !endDate) {
      return data;
    }

    return data.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate && itemDate <= endDate;
    });
  };

  // Update start date and refilter the data
  const handleStartDateChange = (date) => {
    setStartDate(date);
    setDateError(""); 
  };

  // Update end date and refilter the data
  const handleEndDateChange = (date) => {
    if (startDate && date < startDate) {
      setDateError("End date must be greater than or equal to the start date.");
    } else {
      setEndDate(date);
      setDateError(""); 
    }
  };

  // Display the loading or error messages
  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!apiResponse || !apiResponse.data || !apiResponse.data.historical || !apiResponse.data.predictions) {
    return <div>Error: Unexpected response format</div>;
  }

  // Filter historical and predicted data based on selected dates
  const historicalData = filterDataByDate(apiResponse.data.historical);
  const predictionData = filterDataByDate(apiResponse.data.predictions);
  
  // Function to filter and process labels
  const processLabel = (label) => {
    if (!label || label === "No label found" || label.length <= 2) {
      return null;
    }
    return label;
  };

  const combinedData = [
    ...historicalData.map((item) => ({
      date: new Date(item.date).toLocaleDateString(),
      rate: item["attrition rate"].toFixed(2),
      type: "Historical",
      label: processLabel(item.label),
    })),
    ...predictionData.map((item) => ({
      date: new Date(item.date).toLocaleDateString(),
      rate: item["attrition rate"].toFixed(2),
      type: "Predicted",
      label: processLabel(item.label),
    })),
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  const labels = combinedData.map((item) => item.date);

  const historicalRates = combinedData.map((item) =>
    item.type === "Historical" ? item.rate : null
  );
  const predictionRates = combinedData.map((item) =>
    item.type === "Predicted" ? item.rate : null
  );

  const chartData = {
    labels,
    datasets: [
      {
        type: "bar",
        label: "Historical Data",
        data: historicalRates,
        backgroundColor: "rgba(255, 82, 0, 0.9)", // Set to #ff5200 with opacity
        borderColor: "rgba(255, 82, 0, 4)", // Set to #ff5200
        borderWidth: 1,
        yAxisID: "y",
      },
      {
        type: "bar",
        label: "Predicted Data",
        data: predictionRates,
        backgroundColor: "rgba(78, 239, 55, 1)", // Set to #4ef037 with opacity
        borderColor: "rgba(78, 239, 55, 1)", // Set to #4ef037
        borderWidth: 1,
        yAxisID: "y",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text:
          startDate && endDate
            ? `Attrition Rates from ${startDate.toDateString()} to ${endDate.toDateString()}`
            : "Attrition Rates Over Time",
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const dataIndex = context.dataIndex;
            const dataPoint = combinedData[dataIndex];
            let label = `${dataPoint.type} Data: ${dataPoint.rate}%`;
  
            // Add label only if it's valid and meets the criteria
            if (
              dataPoint.label &&
              dataPoint.label !== "No label found" &&
              dataPoint.label.length > 2
            ) {
              label += `\nLabel: ${dataPoint.label}`;
            }
  
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        type: "category",
        title: {
          display: true,
          text: "Date",
        },
        grid: {
          display: false,
        },
        ticks: {
          autoSkip: false,
          maxRotation: 90,
          minRotation: 90,
        },
      },
      y: {
        title: {
          display: true,
          text: "Attrition Percentage",
        },
        beginAtZero: true,
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "800px",
        margin: "0 auto",
        background: "linear-gradient(to bottom, rgba(255, 255, 224, 0.7), rgba(255, 255, 224, 0))", // Faded yellow background
        borderRadius: "8px",
        height:"460px",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
        position: "relative", // Make sure this is relative for absolute positioning of stripes
      }}
    >
      {/* Stripes at the top */}
      <div className="absolute top-0 left-0 right-0 h-16 flex space-x-1" style={{ zIndex: 1 }}>
        {Array.from({ length: 120 }).map((_, index) => (
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
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <label style={{ marginBottom: "5px", color: "#555" }}>Start Date</label>
            <DatePicker
              selected={startDate}
              onChange={handleStartDateChange}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              placeholderText="Start Date"
              style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc", width: "150px" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <label style={{ marginBottom: "5px", color: "#555" }}>End Date</label>
            <DatePicker
              selected={endDate}
              onChange={handleEndDateChange}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              placeholderText="End Date"
              style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc", width: "150px" }}
            />
          </div>
        </div>
        {dateError && <div style={{ color: "red" }}>{dateError}</div>}
      </div>

      <Chart type="bar" data={chartData} options={chartOptions} />
    </div>
  );
};

export default AttritionData;

