import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import moment from 'moment';
import "../styles/styles.css";  // Adjust the path based on your project structure


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

import { Line, Bar } from 'react-chartjs-2';
import { FaCloudUploadAlt, FaSyncAlt, FaBrain, FaChartLine, FaRobot, FaArrowLeft } from 'react-icons/fa';

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

const Home = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [historicalFile, setHistoricalFile] = useState(null);
  const [forecastedFile, setForecastedFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [visualizationData, setVisualizationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({ startDate: '', numDays: '' });
  // const [historicalData, setHistoricalData] = useState(null);
  const [compareData, setCompareData] = useState(null);
  const [weeklyDistributionData, setWeeklyDistributionData] = useState(null);
  const [modelMetrics, setModelMetrics] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [showModelSelection, setShowModelSelection] = useState(false);
  const [isTrainingModels, setIsTrainingModels] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [selectedYear, setSelectedYear] = useState('2023');
  const [volumeChangeStats, setVolumeChangeStats] = useState(null);

  // const navigate = useNavigate();

  const toggleSidebar = () => setSidebarCollapsed(!isSidebarCollapsed);

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (type === "historical") {
      setHistoricalFile(file);
    } else {
      setForecastedFile(file);
    }
  };
  const handleSubmit = async () => {
    setLoading(true);
    setIsTrainingModels(true);
    setErrorMessage(null); // Reset error message at the start
    
    try {
      if (!historicalFile) {
        setErrorMessage("Please upload historical data file"); // Set error message
        throw new Error("Please upload historical data file");
      }
  
      const historicalFormData = new FormData();
      historicalFormData.append("file", historicalFile);
      await axios.post("http://127.0.0.1:8080/upload_historical", historicalFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
  
      const trainingResponse = await axios.post("http://127.0.0.1:8080/train_models");
      setModelMetrics(trainingResponse.data);
      setShowModelSelection(true);
      setIsProcessed(true);
      setErrorMessage(null);
  
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setErrorMessage(error.message || "Failed to process data");
    } finally {
      setLoading(false);
      setIsTrainingModels(false);
    }
  };
  

  const handleReset = () => {
    // Clear all states
    setHistoricalFile(null);
    setForecastedFile(null);
    setVisualizationData(null);
    setShowModelSelection(false);
    setSelectedModel(null);
    setModelMetrics(null);
    setIsProcessed(false);
    setErrorMessage(null);
    setFilter({ startDate: '', numDays: '' });

    // Refresh the page
    window.location.reload();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter({ ...filter, [name]: value });
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 12,
            weight: 'bold'
          },
          padding: 20
        }
      },
      title: {
        display: true,
        font: {
          size: 16,
          weight: 'bold',
          family: "'Inter', sans-serif"
        },
        padding: {
          top: 10,
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        padding: 12,
        cornerRadius: 8
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          font: {
            size: 12
          },
          padding: 8
        },
        title: {
          display: true,
          text: 'Call Volume',
          font: {
            size: 14,
            weight: 'bold'
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12
          },
          padding: 8,
          rotation: 90
        }
      }
    },
    animation: {
      duration: 1500,
      easing: 'easeInOutQuart'
    }
  };

  const applyFilter = async () => {
    if (!filter.startDate || !filter.numDays) {
      setErrorMessage("Please enter both start date and number of days.");
      return;
    }

    setLoading(true);
    try {
      const startDateFormatted = moment(filter.startDate).format('MM-DD-YYYY');
      const response = await axios.get(`http://127.0.0.1:8080/filter_forecast?start_date=${startDateFormatted}&num_days=${filter.numDays}`);

      const filteredData = response.data.FilteredForecast;

      const lineChartData = {
        labels: filteredData.map(forecast => forecast.Date),
        datasets: [{
          label: 'Volume',
          data: filteredData.map(forecast => forecast.Volume),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
        }]
      };

      const barChartData = {
        labels: filteredData.map(forecast => forecast.Date),
        datasets: [{
          label: 'Volume Percentage',
          data: filteredData.map(forecast => forecast.VolumePercentage),
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1,
        }]
      };

      const tooltipCallback = (tooltipItem) => {
        const index = tooltipItem.dataIndex;
        const impactTag = filteredData[index].ImpactTag;
        return impactTag && impactTag.length > 0 
          ? `Impact: ${impactTag.map(tag => Object.values(tag).join(', ')).join('; ')}`
          : '';
      };

      const chartOptionsWithTooltip = {
        ...chartOptions,
        plugins: {
          ...chartOptions.plugins,
          tooltip: {
            ...chartOptions.plugins.tooltip,
            callbacks: {
              afterLabel: tooltipCallback
            }
          }
        }
      };

      setVisualizationData({ 
        lineChartData, 
        barChartData, 
        chartOptions: chartOptionsWithTooltip 
      });
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error.response?.data?.error || "Failed to apply filter.");
    } finally {
      setLoading(false);
    }
  };

  const getWeeklyDistribution = async () => {
    try {
      const response = await axios.get("http://localhost:8080/weekly_distribution");
      if (!response.data || !response.data.WeeklyDistribution) {
        throw new Error("Invalid weekly distribution data");
      }

      const weeklyData = response.data.WeeklyDistribution;
      
      // Format data for charts
      const formattedData = weeklyData.map(week => ({
        weekStart: moment(week.WeekStart, 'MM-DD-YYYY').format('MMM DD'),
        totalVolume: week.TotalVolume
      }));

      const volumeLineData = {
        labels: formattedData.map(data => data.weekStart),
        datasets: [{
          label: 'Weekly Volume',
          data: formattedData.map(data => data.totalVolume),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4,
          fill: true
        }]
      };

      const volumeBarData = {
        labels: formattedData.map(data => data.weekStart),
        datasets: [{
          label: 'Weekly Volume',
          data: formattedData.map(data => data.totalVolume),
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1
        }]
      };

      setWeeklyDistributionData({
        volumeLineData,
        volumeBarData,
        volumeLineOptions: {
          responsive: true,
          plugins: {
            legend: { position: 'top' }
          }
        },
        volumeBarOptions: {
          responsive: true,
          plugins: {
            legend: { position: 'top' }
          }
        }
      });

    } catch (error) {
      console.error("Error fetching weekly distribution data:", error);
      setErrorMessage("Failed to fetch weekly distribution data");
    }
  };

  const getCompareData = async () => {
    try {
      // Clear previous data first
      setCompareData(null);
      setVolumeChangeStats(null);
      
      const response = await axios.get(`http://localhost:8080/prepare_plot_data?year=${selectedYear}`);
      if (!response.data || !response.data.PlotData) {
        throw new Error("Invalid comparison data");
      }

      const plotData = response.data.PlotData;

      // Handle leap year data
      const isLeapYear = (year) => {
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
      };

      // Separate historical and forecasted data
      const historicalData = plotData.filter(item => item.Type === "Historical");
      const forecastedData = plotData.filter(item => item.Type === "Forecasted");

      // Normalize dates to ensure proper alignment
      const normalizeDate = (dateStr) => {
        const [month, day] = dateStr.split('-').map(Number);
        // Create a consistent date format for comparison
        return `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      };

      // Sort and align the data by date
      const sortedHistoricalData = historicalData
        .filter(item => {
          const [month, day] = item.Date.split('-').map(Number);
          return !(month === 2 && day === 29 && !isLeapYear(Number(selectedYear)));
        })
        .map(item => ({
          ...item,
          Date: normalizeDate(item.Date)
        }))
        .sort((a, b) => {
          const [aMonth, aDay] = a.Date.split('-').map(Number);
          const [bMonth, bDay] = b.Date.split('-').map(Number);
          return (aMonth * 100 + aDay) - (bMonth * 100 + bDay);
        });

      const sortedForecastedData = forecastedData
        .map(item => ({
          ...item,
          Date: normalizeDate(item.Date)
        }))
        .sort((a, b) => {
          const [aMonth, aDay] = a.Date.split('-').map(Number);
          const [bMonth, bDay] = b.Date.split('-').map(Number);
          return (aMonth * 100 + aDay) - (bMonth * 100 + bDay);
        });

      // Calculate volume change statistics
      const stats = calculateVolumeChange(sortedHistoricalData, sortedForecastedData);
      setVolumeChangeStats(stats);

      // Format dates for display
      const formatDateForDisplay = (dateStr) => {
        const [month, day] = dateStr.split('-').map(Number);
        return `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      };

      // Create aligned datasets
      const allDates = [...new Set([
        ...sortedHistoricalData.map(item => item.Date),
        ...sortedForecastedData.map(item => item.Date)
      ])].sort((a, b) => {
        const [aMonth, aDay] = a.split('-').map(Number);
        const [bMonth, bDay] = b.split('-').map(Number);
        return (aMonth * 100 + aDay) - (bMonth * 100 + bDay);
      });

      const lineChartCompareData = {
        labels: allDates.map(formatDateForDisplay),
        datasets: [
          {
            label: 'Historical Volume',
            data: allDates.map(date => {
              const histItem = sortedHistoricalData.find(item => item.Date === date);
              return histItem ? histItem.Volume : null;
            }),
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            spanGaps: true
          },
          {
            label: 'Forecasted Volume',
            data: allDates.map(date => {
              const forecastItem = sortedForecastedData.find(item => item.Date === date);
              return forecastItem ? forecastItem.Volume : null;
            }),
            borderColor: 'rgba(153, 102, 255, 1)',
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            spanGaps: true
          }
        ]
      };

      setCompareData(lineChartCompareData);

    } catch (error) {
      console.error("Error fetching compare data:", error);
      setErrorMessage("Failed to fetch comparison data");
    }
  };

  const [dailyForecastData, setDailyForecastData] = useState(null);
  
  useEffect(() => {
    if (dailyForecastData) {
      // Ensure forecast data is available before updating the charts
      const lineChartData = {
        labels: dailyForecastData.map(forecast => forecast.Date),
        datasets: [{
          label: 'Volume',
          data: dailyForecastData.map(forecast => forecast.Volume),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
        }]
      };
  
      const barChartData = {
        labels: dailyForecastData.map(forecast => forecast.Date),
        datasets: [{
          label: 'Volume Percentage',
          data: dailyForecastData.map(forecast => forecast.VolumePercentage),
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1,
        }]
      };
  
      const tooltipCallback = (tooltipItem) => {
        const index = tooltipItem.dataIndex;
        const impactTag = dailyForecastData[index].ImpactTag;
        return impactTag && impactTag.length > 0
          ? `Impact: ${impactTag.map(tag => Object.values(tag).join(', ')).join('; ')}`
          : '';
      };
  
      const chartOptionsWithTooltip = {
        ...chartOptions,
        plugins: {
          ...chartOptions.plugins,
          tooltip: {
            ...chartOptions.plugins.tooltip,
            callbacks: {
              afterLabel: tooltipCallback
            }
          }
        }
      };
  
      setVisualizationData({ 
        lineChartData, 
        barChartData, 
        chartOptions: chartOptionsWithTooltip 
      });
  
      // Fetch additional data after setting visualization
      getWeeklyDistribution();
      getCompareData();
    }
  }, [dailyForecastData]); // This effect runs whenever `dailyForecastData` is updated
  
  const handleModelSelection = async (modelName) => {
    setLoading(true);
    try {
      setSelectedModel(modelName);
  
      let forecastData = null;
  
      if (!forecastedFile) {
        // Generate forecast if no file provided
        const forecastResponse = await axios.post("http://127.0.0.1:8080/generate_forecast", {
          model_name: modelName
        });
        forecastData = forecastResponse.data.DailyForecast;
      } else {
        // If forecast file exists, upload it and distribute using selected model
        const forecastFormData = new FormData();
        forecastFormData.append("file", forecastedFile);
        await axios.post("http://127.0.0.1:8080/upload_forecast", forecastFormData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
  
        const distributionResponse = await axios.post("http://127.0.0.1:8080/distribute_forecast", {
          model_name: modelName
        });
        forecastData = distributionResponse.data.DailyForecast;
      }
  
      setDailyForecastData(forecastData); // Trigger visualization update via useEffect()
  
    } catch (error) {
      console.error("Error in handleModelSelection:", error);
      setErrorMessage(error.response?.data?.error || "Failed to process forecast");
    } finally {
      setLoading(false);
    }
  };
  
  const handleDownload = () => {
    try {
      if (!dailyForecastData) {
        setErrorMessage("No forecast data available for download.");
        return;
      }
      const jsonData = JSON.stringify(dailyForecastData, null, 2);
      const blob = new Blob([jsonData], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "forecast.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      setErrorMessage("Failed to download JSON file. Please try again.");
    }
  };
  
  

  // Update the ModelTrainingLoader component
  const ModelTrainingLoader = () => (
    <div className="fixed inset-0 backdrop-filter backdrop-blur-sm bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white/90 p-10 rounded-2xl shadow-2xl max-w-md w-full mx-4 transform hover:scale-105 transition-transform duration-300">
        <div className="flex flex-col items-center">
          <div className="relative mb-6">
            <div className="w-28 h-28 rounded-full border-t-4 border-b-4 border-[#FFBF00] animate-spin"></div>
            <FaBrain className="text-[#FFBF00] text-4xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
  
          <h3 className="text-2xl font-bold mb-4 text-gray-800 tracking-wide">
            Training AI Models
          </h3>
  
          <div className="w-full bg-gray-100 h-3 rounded-full mt-4 overflow-hidden relative">
            <div className="bg-[#FFBF00] h-full rounded-full animate-loading-bar absolute"></div>
          </div>
  
          <p className="text-gray-600 text-sm mt-6 text-center font-medium">
            Optimizing prediction algorithms...
          </p>
        </div>
      </div>
    </div>
  );
  
  // Update the ChartContainer component for larger charts
  const ChartContainer = ({ title, children }) => (
    <div className="bg-gray-50 p-8 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow duration-300 h-[600px]">
      <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
        <FaChartLine className="mr-3 text-[#FFBF00] text-xl" />
        {title}
      </h3>
      <div className="h-[500px] relative">
        {children}
      </div>
    </div>
  );

  // Add this function to calculate volume change
  const calculateVolumeChange = (historicalData, forecastedData) => {
    const historicalSum = historicalData.reduce((sum, item) => sum + item.Volume, 0);
    const forecastedSum = forecastedData.reduce((sum, item) => sum + item.Volume, 0);
    const percentageChange = ((forecastedSum - historicalSum) / historicalSum) * 100;
    
    return {
      historicalSum: Math.round(historicalSum),
      forecastedSum: Math.round(forecastedSum),
      percentageChange: percentageChange.toFixed(2)
    };
  };

  // Update the chart options for the bar chart
  const barChartOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        title: {
          display: true,
          text: 'Call Volume Percentage (Month-wise)', // Add the Y-axis title here
          font: {
            size: 14,
            weight: 'bold'
          }
        }
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-x-hidden">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      <div className={`flex-1 transition-all ${isSidebarCollapsed ? "ml-16" : "ml-40"}`}>
        <TopBar />
        <div className="pt-20 px-4 lg:px-12 pb-12 max-w-[1920px] mx-auto">
          {selectedModel && (
            <button
              onClick={handleReset}
              className="fixed top-24 left-48 z-10 bg-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <FaArrowLeft className="text-gray-600 text-xl" />
            </button>
          )}
          <header className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-800 mb-3">
              AI-Powered Demand Forecasting
            </h1>
            <p className="text-gray-600 text-lg">Transform your historical data into accurate future predictions</p>
          </header>
          
          {/* File Upload Section - Wider layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16 max-w-[1600px] mx-auto px-4 lg:px-8">
            <div className="bg-white shadow-lg rounded-xl p-8 transform hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-[#FFBF00]/10 rounded-full flex items-center justify-center mr-4">
                  <FaCloudUploadAlt className="text-2xl text-[#FFBF00]" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Historical Data *
                </h2>
              </div>
              <div className="relative">
                <input
                  type="file"
                  className="block w-full text-sm text-gray-500 
                    file:mr-4 file:py-3 file:px-6 
                    file:rounded-full file:border-0 
                    file:text-sm file:font-semibold
                    file:bg-[#FFBF00] file:text-gray-800 
                    hover:file:bg-[#FFBF00]/90
                    file:transition-colors
                    cursor-pointer"
                  onChange={(e) => handleFileUpload(e, "historical")}
                  required
                />
                {/* {historicalFile && (
                  <p className="text-sm text-gray-500 mt-3 ml-2">{historicalFile.name}</p>
                )} */}
                <p className="text-sm text-gray-500 mt-3 ml-2">* Required for analysis</p>
              </div>
            </div>

            <div className="bg-white shadow-lg rounded-xl p-8 transform hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                  <FaChartLine className="text-2xl text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Forecast Data
                </h2>
              </div>
              <div className="relative">
                <input
                  type="file"
                  className="block w-full text-sm text-gray-500 
                    file:mr-4 file:py-3 file:px-6 
                    file:rounded-full file:border-0 
                    file:text-sm file:font-semibold
                    file:bg-purple-600 file:text-white 
                    hover:file:bg-purple-700
                    file:transition-colors
                    cursor-pointer"
                  onChange={(e) => handleFileUpload(e, "forecasted")}
                />
                {/* {forecastedFile && (
                  <p className="text-sm text-gray-500 mt-3 ml-2">{forecastedFile.name}</p>
                )} */}
                <p className="text-sm text-gray-500 mt-3 ml-2">Optional: AI will generate forecast if not provided</p>
              </div>
            </div>
          </div>

          {/* Process Button - Disabled when already processed */}
          <div className="text-center mb-12">
            <button
              className={`
                px-8 py-4 rounded-full font-semibold text-lg
                shadow-lg transform transition-all duration-300
                flex items-center justify-center mx-auto
                ${loading || isTrainingModels || isProcessed
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-[#FFBF00] hover:bg-[#FFBF00]/90 hover:scale-105'
                }
              `}
              onClick={handleSubmit}
              disabled={loading || isTrainingModels || isProcessed}
            >
              <FaRobot className={`mr-3 text-xl ${loading ? 'animate-spin' : ''}`} />
              <span>
                {loading ? 'Processing...' : isProcessed ? 'Processing Complete' : 'Start AI Analysis'}
              </span>
            </button>
          </div>

          {/* Model Selection Section - Wider layout */}
          {showModelSelection && modelMetrics && (
            <div className="bg-white shadow-lg rounded-xl p-10 mb-16 max-w-[1600px] mx-auto">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <FaBrain className="mr-3 text-[#FFBF00]" />
                AI Model Performance
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(modelMetrics.ModelAccuracies).map(([modelName, metrics]) => (
                  <div 
                    key={modelName}
                    className={`
                      p-6 rounded-xl border-2 transition-all duration-300
                      ${modelMetrics.BestModel === modelName 
                        ? 'border-green-500 bg-green-50 shadow-lg' 
                        : 'border-gray-200 hover:border-[#FFBF00] hover:shadow-md'
                      }
                    `}
                  >
                    <h3 className="font-bold text-lg mb-4">{modelName}</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Accuracy</span>
                        <span className="font-semibold">{(metrics.Accuracy ).toFixed(2)}%</span>
                      </div>
                    </div>
                    <button
                      className={`
                        mt-6 px-6 py-3 rounded-full w-full font-semibold
                        transition-all duration-300
                        ${selectedModel === modelName
                          ? 'bg-green-600 text-white'
                          : 'bg-[#FFBF00] text-gray-800 hover:bg-[#FFBF00]/90'
                        }
                      `}
                      onClick={() => handleModelSelection(modelName)}
                    >
                      {selectedModel === modelName ? 'Selected' : 'Select Model'}
                    </button>
                  </div>
                ))}
              </div>
              {modelMetrics.BestModel && (
                <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
                  <p className="text-green-700 font-medium flex items-center">
                    <FaRobot className="mr-2" />
                    AI Recommends: <span className="font-bold ml-2">{modelMetrics.BestModel}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Show the training loader when models are being trained */}
          {isTrainingModels && <ModelTrainingLoader />}

          {/* Error Messages */}
          {errorMessage && (
            <div className="max-w-6xl mx-auto mb-8">
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
                <p className="text-red-700">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Enhanced Visualization Section - Full width */}
          {selectedModel && visualizationData && (
            <div className="w-full">
              {/* Filter Section */}
              <div className="bg-white shadow-lg rounded-xl p-8 mb-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-8 flex items-center">
                  <FaChartLine className="mr-3 text-[#FFBF00]" />
                  Filter Data
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                  <input
                    type="date"
                    className="p-3 border rounded-xl focus:ring-2 focus:ring-[#FFBF00] focus:border-transparent"
                    name="startDate"
                    value={filter.startDate}
                    onChange={handleFilterChange}
                  />
                  <input
                    type="number"
                    className="p-3 border rounded-xl focus:ring-2 focus:ring-[#FFBF00] focus:border-transparent"
                    name="numDays"
                    value={filter.numDays}
                    onChange={handleFilterChange}
                    placeholder="Number of days"
                  />
                  <button
                    className="px-6 py-3 bg-[#FFBF00] text-gray-800 font-semibold rounded-xl 
                             shadow-md hover:bg-[#FFBF00]/90 transition-all duration-300"
                    onClick={applyFilter}
                  >
                    Apply Filter
                  </button>
                </div>
              </div>

              {/* Charts Section - Larger charts */}
              <div className="space-y-12">
                <div className="bg-white shadow-lg rounded-xl p-10">
                  <h2 className="text-3xl font-bold text-gray-800 mb-8 flex items-center">
                    <FaBrain className="mr-3 text-[#FFBF00]" />
                    Forecast Analysis using {selectedModel}
                  </h2>
                  
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                    <ChartContainer title="Daily Forecast Volume">
                      <Line
                    data={visualizationData.lineChartData}
                    options={visualizationData.chartOptions}
                  />
                    </ChartContainer>
                    
                    <ChartContainer title="Volume Percentage">
                      <Bar
                    data={visualizationData.barChartData}
                    options={barChartOptions}
                  />
                    </ChartContainer>
                  </div>
                </div>

                {/* Weekly Distribution Section - Larger charts */}
                {weeklyDistributionData && (
                  <div className="bg-white shadow-lg rounded-xl p-10">
                    <h2 className="text-3xl font-bold text-gray-800 mb-8">
                      Weekly Distribution Analysis
                    </h2>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                      <ChartContainer title="Weekly Volume Trend">
                        <Line
                          data={weeklyDistributionData.volumeLineData}
                          options={{
                            ...chartOptions,
                            plugins: {
                              ...chartOptions.plugins,
                              title: {
                                ...chartOptions.plugins.title,
                                text: 'Weekly Volume Trends'
                              }
                            }
                          }}
                        />
                      </ChartContainer>
                      
                      <ChartContainer title="Weekly Distribution">
                        <Bar
                          data={weeklyDistributionData.volumeBarData}
                          options={{
                            ...chartOptions,
                            plugins: {
                              ...chartOptions.plugins,
                              title: {
                                ...chartOptions.plugins.title,
                                text: 'Weekly Distribution'
                              }
                            }
                          }}
                        />
                      </ChartContainer>
                    </div>
                  </div>
                )}

                {/* Comparison Section - Full width chart */}
                {compareData && (
                  <div className="bg-white shadow-lg rounded-xl p-10">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
                      <div className="flex items-center gap-4">
                        <h2 className="text-3xl font-bold text-gray-800">
                          Historical vs Forecasted Comparison
                        </h2>
                        <select
                          value={selectedYear}
                          onChange={(e) => {
                            const newYear = e.target.value;
                            setSelectedYear(newYear);
                            (async () => {
                              try {
                                // Clear previous data first
                                setCompareData(null);
                                setVolumeChangeStats(null);
                                
                                const response = await axios.get(`http://localhost:8080/prepare_plot_data?year=${newYear}`);
                                if (!response.data || !response.data.PlotData) {
                                  throw new Error("Invalid comparison data");
                                }

                                const plotData = response.data.PlotData;

                                // Handle leap year data
                                const isLeapYear = (year) => {
                                  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
                                };

                                // Separate historical and forecasted data
                                const historicalData = plotData.filter(item => item.Type === "Historical");
                                const forecastedData = plotData.filter(item => item.Type === "Forecasted");

                                // Normalize dates to ensure proper alignment
                                const normalizeDate = (dateStr) => {
                                  const [month, day] = dateStr.split('-').map(Number);
                                  // Create a consistent date format for comparison
                                  return `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                                };

                                // Sort and align the data by date
                                const sortedHistoricalData = historicalData
                                  .filter(item => {
                                    const [month, day] = item.Date.split('-').map(Number);
                                    return !(month === 2 && day === 29 && !isLeapYear(Number(newYear)));
                                  })
                                  .map(item => ({
                                    ...item,
                                    Date: normalizeDate(item.Date)
                                  }))
                                  .sort((a, b) => {
                                    const [aMonth, aDay] = a.Date.split('-').map(Number);
                                    const [bMonth, bDay] = b.Date.split('-').map(Number);
                                    return (aMonth * 100 + aDay) - (bMonth * 100 + bDay);
                                  });

                                const sortedForecastedData = forecastedData
                                  .map(item => ({
                                    ...item,
                                    Date: normalizeDate(item.Date)
                                  }))
                                  .sort((a, b) => {
                                    const [aMonth, aDay] = a.Date.split('-').map(Number);
                                    const [bMonth, bDay] = b.Date.split('-').map(Number);
                                    return (aMonth * 100 + aDay) - (bMonth * 100 + bDay);
                                  });

                                // Calculate volume change statistics
                                const stats = calculateVolumeChange(sortedHistoricalData, sortedForecastedData);
                                setVolumeChangeStats(stats);

                                // Format dates for display
                                const formatDateForDisplay = (dateStr) => {
                                  const [month, day] = dateStr.split('-').map(Number);
                                  return `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                                };

                                // Create aligned datasets
                                const allDates = [...new Set([
                                  ...sortedHistoricalData.map(item => item.Date),
                                  ...sortedForecastedData.map(item => item.Date)
                                ])].sort((a, b) => {
                                  const [aMonth, aDay] = a.split('-').map(Number);
                                  const [bMonth, bDay] = b.split('-').map(Number);
                                  return (aMonth * 100 + aDay) - (bMonth * 100 + bDay);
                                });

                                const lineChartCompareData = {
                                  labels: allDates.map(formatDateForDisplay),
                                  datasets: [
                                    {
                                      label: 'Historical Volume',
                                      data: allDates.map(date => {
                                        const histItem = sortedHistoricalData.find(item => item.Date === date);
                                        return histItem ? histItem.Volume : null;
                                      }),
                                      borderColor: 'rgba(75, 192, 192, 1)',
                                      backgroundColor: 'rgba(75, 192, 192, 0.2)',
                                      spanGaps: true
                                    },
                                    {
                                      label: 'Forecasted Volume',
                                      data: allDates.map(date => {
                                        const forecastItem = sortedForecastedData.find(item => item.Date === date);
                                        return forecastItem ? forecastItem.Volume : null;
                                      }),
                                      borderColor: 'rgba(153, 102, 255, 1)',
                                      backgroundColor: 'rgba(153, 102, 255, 0.2)',
                                      spanGaps: true
                                    }
                                  ]
                                };

                                setCompareData(lineChartCompareData);

                              } catch (error) {
                                console.error("Error fetching compare data:", error);
                                setErrorMessage("Failed to fetch comparison data");
                              }
                            })();
                          }}
                          className="p-3 text-lg font-semibold border-2 rounded-lg 
                                     focus:ring-2 focus:ring-[#FFBF00] focus:border-[#FFBF00] 
                                     min-w-[120px] cursor-pointer bg-gray-50"
                        >
                          <option value="2021">2021</option>
                          <option value="2022">2022</option>
                          <option value="2023">2023</option>
                        </select>
                      </div>
                    </div>
                    
                    {volumeChangeStats && (
                      <div className="bg-gray-50 p-6 rounded-lg mb-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                            <p className="font-semibold text-gray-600">
                              Historical Volume ({selectedYear})
                            </p>
                            <p className="text-xl font-bold mt-2">
                              {volumeChangeStats.historicalSum.toLocaleString()}
                            </p>
                          </div>
                          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                            <p className="font-semibold text-gray-600">
                              Forecasted Volume (2024)
                            </p>
                            <p className="text-xl font-bold mt-2">
                              {volumeChangeStats.forecastedSum.toLocaleString()}
                            </p>
                          </div>
                          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                            <p className="font-semibold text-gray-600">Volume Change</p>
                            <p className={`text-xl font-bold mt-2 ${
                              volumeChangeStats.percentageChange > 0 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {volumeChangeStats.percentageChange}%
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="h-[600px]">
                      <Line 
                        data={compareData} 
                        options={{
                          ...chartOptions,
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            ...chartOptions.scales,
                            x: {
                              ...chartOptions.scales.x,
                              ticks: {
                                ...chartOptions.scales.x.ticks,
                                rotation: 90,
                                maxRotation: 90,
                                minRotation: 90,
                                font: {
                                  size: 12
                                }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Download Button - Centered and larger */}
                <div className="text-center py-8">
                  <button
                    className="px-12 py-5 bg-purple-600 text-white text-lg font-semibold rounded-xl 
                             shadow-lg hover:bg-purple-700 transition-all duration-300
                             flex items-center justify-center mx-auto
                             hover:scale-105 transform"
                    onClick={handleDownload}
                  >
                    <FaCloudUploadAlt className="mr-3 text-2xl" />
                    Download Forecast Data
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;