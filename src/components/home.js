/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import moment from 'moment';
import { format } from 'date-fns';
import "../styles/styles.css";  // Adjust the path based on your project structure
import { motion, AnimatePresence } from "framer-motion";
import { FaCloudUploadAlt, FaSyncAlt, FaBrain, FaChartLine, FaArrowLeft, FaDatabase, FaStar } from 'react-icons/fa';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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
  ArcElement,
  Filler
} from "chart.js";

import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

const ModelCard = ({ model, accuracy, isSelected, isHighest, onClick }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className={`
      p-6 rounded-xl shadow-md cursor-pointer transition-all duration-300
      ${isSelected ? 'ring-2 ring-amber-500' : ''}
      ${isHighest ? 'bg-gradient-to-br from-amber-50 to-amber-100' : 'bg-white'}
    `}
    onClick={onClick}
  >
    <h3 className="text-xl font-semibold text-gray-800 mb-2">{model}</h3>
    <div className="flex items-end justify-between">
      <p className={`text-3xl font-bold ${isHighest ? 'text-amber-600' : 'text-gray-600'}`}>
        {accuracy}%
      </p>
      <p className="text-gray-600">Accuracy</p>
    </div>
    {isHighest && (
      <div className="mt-2 text-sm text-amber-600 flex items-center">
        <FaStar className="mr-1" /> Highest Accuracy
      </div>
    )}
  </motion.div>
);

const ForecastParamsModal = ({ isOpen, onClose, onApply, growthRateParams, setGrowthRateParams, events, setEvents }) => {
  const [isApplying, setIsApplying] = useState(false);
  const [newEvent, setNewEvent] = useState({ Date: null, EventType: '', Description: '' });
  
  const addEvent = () => {
    if (!newEvent.Date || !newEvent.EventType || !newEvent.Description) return;
    
    const formattedEvent = {
      Date: newEvent.Date ? format(newEvent.Date, 'MM/dd/yyyy') : '',
      [newEvent.EventType]: newEvent.Description
    };
    
    setEvents(prev => [...prev, formattedEvent]);
    setNewEvent({ Date: null, EventType: '', Description: '' });
  };
  
  const removeEvent = (index) => {
    setEvents(prev => prev.filter((_, i) => i !== index));
  };
  
  // Check if growth rate parameters are valid
  const isGrowthRateValid = growthRateParams.From && growthRateParams.To && growthRateParams.Rate !== null;
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-xl font-semibold mb-4">Forecast Parameters</h3>
            
            {/* Growth Rate Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-800">Growth Rate</h4>
                <div className="flex items-center">
                  <div className={`h-2.5 w-2.5 rounded-full mr-1.5 ${isGrowthRateValid ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-xs text-gray-500">{isGrowthRateValid ? 'Configured' : 'Not configured'}</span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
                    <DatePicker
                      selected={growthRateParams.From ? new Date(growthRateParams.From) : null}
                      onChange={(date) => setGrowthRateParams(prev => ({ ...prev, From: date }))}
                      className="w-full p-2 border rounded-lg text-sm"
                      placeholderText="MM/DD/YYYY"
                      dateFormat="MM/dd/yyyy"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
                    <DatePicker
                      selected={growthRateParams.To ? new Date(growthRateParams.To) : null}
                      onChange={(date) => setGrowthRateParams(prev => ({ ...prev, To: date }))}
                      className="w-full p-2 border rounded-lg text-sm"
                      placeholderText="MM/DD/YYYY"
                      dateFormat="MM/dd/yyyy"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Growth Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Enter growth rate percentage"
                    value={growthRateParams.Rate !== null ? growthRateParams.Rate : ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? null : parseFloat(e.target.value);
                      setGrowthRateParams(prev => ({ ...prev, Rate: value }));
                    }}
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>
                {isGrowthRateValid && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => setGrowthRateParams({ From: null, To: null, Rate: null })}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Events Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-800">Events</h4>
                <div className="flex items-center">
                  <div className={`h-2.5 w-2.5 rounded-full mr-1.5 ${events.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-xs text-gray-500">{events.length > 0 ? `${events.length} configured` : 'Not configured'}</span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                    <DatePicker
                      selected={newEvent.Date}
                      onChange={(date) => setNewEvent(prev => ({ ...prev, Date: date }))}
                      className="w-full p-2 border rounded-lg text-sm"
                      placeholderText="MM/DD/YYYY"
                      dateFormat="MM/dd/yyyy"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Event Type</label>
                      <select
                        value={newEvent.EventType}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, EventType: e.target.value }))}
                        className="w-full p-2 border rounded-lg text-sm"
                      >
                        <option value="">Select type</option>
                        <option value="Holiday">Holiday</option>
                        <option value="System Down">System Down</option>
                        <option value="System Maintenance">System Maintenance</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                      <input
                        type="text"
                        placeholder="Event description"
                        value={newEvent.Description}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, Description: e.target.value }))}
                        className="w-full p-2 border rounded-lg text-sm"
                      />
                    </div>
                  </div>
                  <button
                    onClick={addEvent}
                    disabled={!newEvent.Date || !newEvent.EventType || !newEvent.Description}
                    className={`w-full py-1.5 rounded-lg text-sm ${!newEvent.Date || !newEvent.EventType || !newEvent.Description ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-amber-500 text-white hover:bg-amber-600'}`}
                  >
                    Add Event
                  </button>
                </div>
                
                {/* Event List */}
                {events.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs font-medium text-gray-700 mb-1.5">Added Events:</div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {events.map((event, index) => {
                        const eventType = Object.keys(event).find(key => key !== 'Date');
                        return (
                          <div key={index} className="flex justify-between items-center bg-white p-2 rounded border text-sm">
                            <div>
                              <span className="font-medium">{event.Date}</span>
                              <span className="mx-1.5 text-gray-400">|</span>
                              <span className="text-gray-700">{eventType}: {event[eventType]}</span>
                            </div>
                            <button
                              onClick={() => removeEvent(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    {events.length > 0 && (
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={() => setEvents([])}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Clear All
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={isApplying}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setIsApplying(true);
                  try {
                    await onApply();
                  } finally {
                    setIsApplying(false);
                  }
                }}
                disabled={isApplying || (!isGrowthRateValid && events.length === 0)}
                className={`px-4 py-2 rounded-lg flex items-center ${(!isGrowthRateValid && events.length === 0) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-amber-500 text-white hover:bg-amber-600'}`}
              >
                {isApplying ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Applying...
                  </>
                ) : (
                  'Apply Parameters'
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Update the input styles with new theme
const inputStyles = `
  p-4 text-lg border-2 rounded-xl focus:ring-2 focus:ring-amber-500 
  focus:border-amber-500 transition-all duration-300 
  bg-gray-50 hover:bg-white shadow-sm hover:shadow-md
  w-full
`;

const buttonStyles = `
  px-8 py-4 text-lg font-semibold rounded-xl
  bg-gradient-to-r from-amber-500 to-amber-600 text-white
  hover:from-amber-600 hover:to-amber-700
  transform hover:scale-105 transition-all duration-300
  shadow-lg hover:shadow-xl
  disabled:opacity-50 disabled:cursor-not-allowed
  disabled:hover:scale-100
`;

const Home = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [file, setFile] = useState(null);
  const [ingestionResponse, setIngestionResponse] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [forecastParams, setForecastParams] = useState({
    MapActivityId: '',
    StartDate: '',
    TotalNumberOfDays: '',
    Year: 2023,
  });
  const [activeSection, setActiveSection] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [showForecastParamsModal, setShowForecastParamsModal] = useState(false);
  const [growthRateParams, setGrowthRateParams] = useState({
    From: null,
    To: null,
    Rate: null
  });
  const [events, setEvents] = useState([]);
  const [selectedYear, setSelectedYear] = useState("2023");
  const [historicalVsForecastData, setHistoricalVsForecastData] = useState(null);
  const [yearOptions] = useState(["2023", "2022", "2021"]);  // Fixed year options
  const [plotData, setPlotData] = useState(null);
  const [plotLoading, setPlotLoading] = useState(false);
  const [plotError, setPlotError] = useState(null);
  const [availableYears, setAvailableYears] = useState([]);

  const toggleSidebar = () => setSidebarCollapsed(!isSidebarCollapsed);

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
  };

  const handleIngestion = async () => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        'http://127.0.0.1:8001/demandforecast_ingestion',
        // 'https://ai-forecast-api.datanitiv.dev/demandforecast_ingestion',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      setIngestionResponse(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to ingest data');
    } finally {
      setLoading(false);
    }
  };

  const handleForecastParamChange = (e) => {
    const { name, value } = e.target;
    setForecastParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGetForecast = async (customParams = null) => {
    setLoading(true);
    setError(null);
    try {
      const paramsToSend = customParams || {
        MapActivityId: forecastParams.MapActivityId,
        StartDate: forecastParams.StartDate,
        TotalNumberOfDays: forecastParams.TotalNumberOfDays,
      };

      // Only include ModelName if it's coming from a custom parameter
      // This ensures that when clicking Get Forecast normally, all models are returned
      if (customParams && customParams.ModelName) {
        // Keep the ModelName parameter from custom params
      } else if (customParams) {
        // For other custom params, remove ModelName to get all models
        delete paramsToSend.ModelName;
      }

      const response = await axios.post(
        'http://127.0.0.1:8001/demandforecast',
        // 'https://ai-forecast-api.datanitiv.dev/demandforecast',
        paramsToSend
      );

      const cleanedData = response.data;
      
      // If this is a custom parameters request (growth rate or events), preserve the original forecast data
      if (customParams && (customParams.GrowthRate || (customParams.Events && customParams.Events.length > 0))) {
        // If we don't have original data stored yet, use the current forecastData as original
        if (!forecastData.originalData) {
          setForecastData({
            ...cleanedData,
            originalData: forecastData
          });
        } else {
          // Keep the original data
          setForecastData({
            ...cleanedData,
            originalData: forecastData.originalData
          });
        }
      } else {
        // This is the initial forecast, store it as is
        setForecastData(cleanedData);
      }
      
      // If this is the first load, select the highest accuracy model
      if (!customParams && cleanedData.ForecastDemand) {
        const highestAccuracyModel = cleanedData.ForecastDemand.reduce(
          (prev, current) => (current.ModelAccuracy > prev.ModelAccuracy ? current : prev)
        );
        setSelectedModel(highestAccuracyModel.Model);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to get forecast');
    } finally {
      setLoading(false);
    }
  };

  const modelColors = {
    'SARIMAX': {
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.5)'
    },
    'ARIMA': {
      borderColor: 'rgb(255, 99, 132)',
      backgroundColor: 'rgba(255, 99, 132, 0.5)'
    },
    'ExponentialSmoothing': {
      borderColor: 'rgb(53, 162, 235)',
      backgroundColor: 'rgba(53, 162, 235, 0.5)'
    }
  };

  // Add this function to format the interval label
  const formatIntervalLabel = (from, to) => {
    return `${from} - ${to}`;
  };

  const prepareChartData = (forecastResults, selectedModel) => {
    if (!forecastResults || !selectedDate || !selectedModel) return null;

    // Find the selected model's data
    const modelData = forecastResults.find(result => result.Model === selectedModel);
    if (!modelData) return null;

    // Find the selected day's data
    const dayData = modelData.ForecastedData.find(day => day.Date === selectedDate);
    if (!dayData) return null;

    // Prepare the dataset
    const dataset = {
      labels: dayData.Forecasts.map(forecast => formatIntervalLabel(forecast.From, forecast.To)),
      datasets: [{
        label: modelData.Model,
        data: dayData.Forecasts.map(forecast => forecast.Volume),
        borderColor: modelColors[modelData.Model]?.borderColor || 'rgb(75, 192, 192)',
        backgroundColor: modelColors[modelData.Model]?.backgroundColor || 'rgba(75, 192, 192, 0.5)',
        fill: false,
        tension: 0.4
      }]
    };

    return dataset;
  };

  const prepareDailyPatternData = (forecastResults) => {
    if (!forecastResults || !forecastResults.length || !selectedDate) return null;

    const selectedDayData = forecastResults[0].ForecastedData.find(day => day.Date === selectedDate);
    if (!selectedDayData) return null;

    const labels = selectedDayData.Forecasts.map(forecast => 
      formatIntervalLabel(forecast.From, forecast.To)
    );
    const data = selectedDayData.Forecasts.map(forecast => forecast.Volume);

    return {
      labels,
      datasets: [{
        label: 'Volume Pattern',
        data: data,
        backgroundColor: 'rgba(255, 191, 0, 0.8)',
        borderColor: 'rgba(255, 191, 0, 1)',
        fill: true,
      }]
    };
  };

  const prepareImpactAnalysisData = (forecastResults) => {
    if (!forecastResults || !forecastResults.length) return null;

    // Calculate daily totals for each day and organize by model
    const modelData = forecastResults.map(result => {
      const dailyData = result.ForecastedData.map(dayData => {
        const totalVolume = dayData.Forecasts.reduce((sum, forecast) => sum + forecast.Volume, 0);
        return {
          date: moment(dayData.Date, 'MM-DD-YYYY').format('MM-DD-YYYY'),
          displayDate: moment(dayData.Date, 'MM-DD-YYYY').format('MM-DD'),
          totalVolume,
          hasImpact: dayData.ImpactTag && dayData.ImpactTag.length > 0,
          impactTag: dayData.ImpactTag?.[0]?.Holiday || null
        };
      });

      return {
        model: result.Model,
        data: dailyData
      };
    });

    // Get unique dates for x-axis
    const dates = modelData[0].data.map(d => d.displayDate);

    return {
      labels: dates,
      datasets: modelData.map(modelItem => ({
        label: modelItem.model,
        data: modelItem.data.map(d => d.totalVolume),
        borderColor: modelColors[modelItem.model].borderColor,
        backgroundColor: modelColors[modelItem.model].backgroundColor,
        borderWidth: 2,
        tension: 0.4,
        fill: false,
        pointRadius: 3,
        pointHoverRadius: 6,
        impactData: modelItem.data.map(d => ({
          hasImpact: d.hasImpact,
          impactTag: d.impactTag
        }))
      }))
    };
  };

  // Update the fetchHistoricalVsForecastData function to be memoized
  const fetchHistoricalVsForecastData = useCallback(async (mapActivityId, year, modelName = null) => {
    try {
      setLoading(true);
      const params = {
        MapActivityId: mapActivityId,
        Year: year
      };
      
      if (modelName) {
        params.ModelName = modelName;
      }
      
      const response = await axios.post(
        // 'http://127.0.0.1:8001/demandforecast_plot_data',
        'https://ai-forecast-api.datanitiv.dev/demandforecast_plot_data',
        params
      );
      
      setHistoricalVsForecastData(response.data);
    } catch (err) {
      // setError(err.response?.data?.error || 'Failed to fetch comparison data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Update the useEffect hooks with proper dependencies
  useEffect(() => {
    if (forecastData && selectedModel && forecastParams.MapActivityId) {
      fetchHistoricalVsForecastData(
        forecastParams.MapActivityId,
        selectedYear,
        selectedModel
      );
    }
  }, [forecastData, selectedModel, selectedYear, forecastParams.MapActivityId, fetchHistoricalVsForecastData]);

  // Update the fetchPlotData function to be memoized with useCallback
  const fetchPlotData = useCallback(async () => {
    if (!forecastParams.MapActivityId) {
      setPlotError('MapActivity ID is required to fetch plot data');
      return;
    }
    
    try {
      setPlotLoading(true);
      setPlotError(null);
      
      const params = {
        MapActivityId: forecastParams.MapActivityId,
        Year: selectedYear,
        ModelName: selectedModel || 'SARIMAX'
      };
      
      const queryString = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
      
      const response = await axios.get(
        `http://127.0.0.1:8001/prepare_plot_data?${queryString}`
        // `https://ai-forecast-api.datanitiv.dev/prepare_plot_data?${queryString}`
      );
      
      const cleanedData = response.data;
      if (cleanedData.PlotData) {
        const originalForecastData = cleanedData.PlotData.filter(item => item.Type === "Forecasted");
        cleanedData.OriginalForecastData = originalForecastData;
      }
      
      setPlotData(cleanedData);
      
      if (cleanedData.AvailableYears && cleanedData.AvailableYears.length > 0) {
        const years = cleanedData.AvailableYears.map(year => year.toString());
        setAvailableYears(years);
        
        if (!years.includes(selectedYear)) {
          setSelectedYear(years[years.length - 1]);
        }
      }
      
      setPlotLoading(false);
    } catch (err) {
      setPlotError(err.response?.data?.error || 'Failed to fetch plot data');
      setPlotLoading(false);
    }
  }, [forecastParams.MapActivityId, selectedYear, selectedModel]);

  // Update the useEffect hooks with proper dependencies
  useEffect(() => {
    if (forecastData && selectedModel && forecastParams.MapActivityId) {
      fetchPlotData();
    }
  }, [forecastData, selectedModel, forecastParams.MapActivityId, fetchPlotData]);

  // Add this function to prepare the comparison chart data
  const prepareHistoricalVsForecastChart = (data) => {
    if (!data || !data.PlotData) return null;
    
    const plotData = data.PlotData;
    
    // Separate historical and forecasted data
    const historicalData = plotData.filter(item => item.Type === "Historical");
    const forecastedData = plotData.filter(item => item.Type === "Forecasted");
    
    // Get all unique dates
    const allDates = [...new Set([
      ...historicalData.map(item => item.Date),
      ...forecastedData.map(item => item.Date)
    ])].sort();
    
    return {
      labels: allDates,
      datasets: [
        {
          label: 'Historical',
          data: allDates.map(date => {
            const item = historicalData.find(d => d.Date === date);
            return item ? item.Volume : null;
          }),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: false,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 6
        },
        {
          label: 'Forecasted',
          data: allDates.map(date => {
            const item = forecastedData.find(d => d.Date === date);
            return item ? item.Volume : null;
          }),
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          fill: false,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 6
        }
      ]
    };
  };

  // Add this function to prepare the plot chart data
  const preparePlotChartData = (data) => {
    if (!data || !data.PlotData) return null;
    
    const plotData = data.PlotData;
    
    // Separate historical and forecasted data
    const historicalData = plotData.filter(item => item.Type === "Historical");
    const forecastedData = plotData.filter(item => item.Type === "Forecasted");
    
    // Get all unique dates
    const allDates = [...new Set([
      ...historicalData.map(item => item.Date),
      ...forecastedData.map(item => item.Date)
    ])].sort();
    
    return {
      labels: allDates,
      datasets: [
        {
          label: 'Historical',
          data: allDates.map(date => {
            const item = historicalData.find(d => d.Date === date);
            return item ? item.Volume : null;
          }),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: false,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 6
        },
        {
          label: 'Forecasted',
          data: allDates.map(date => {
            const item = forecastedData.find(d => d.Date === date);
            return item ? item.Volume : null;
          }),
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          fill: false,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 6
        }
      ]
    };
  };

  const cards = [
    {
      id: 'ingestion',
      title: 'Data Ingestion',
      icon: <FaDatabase className="text-4xl text-blue-500" />,
      description: 'Upload and process your data'
    },
    {
      id: 'forecast',
      title: 'Forecast Distribution',
      icon: <FaChartLine className="text-4xl text-purple-500" />,
      description: 'Create AI-powered demand predictions'
    }
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 overflow-hidden">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      <div className={`flex-1 transition-all ${isSidebarCollapsed ? "ml-15" : "ml-40"} overflow-y-auto overflow-x-hidden`}>
        <TopBar />
        <div className="pt-20 px-4 pb-12 w-full">
          <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-20 p-4"
          >
            <h1 className="text-7xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 text-shadow-lg leading-snug">
              AI-Powered Demand Forecasting
            </h1>
            <p className="text-gray-600 text-2xl mt-4">Transform your historical data into accurate future predictions</p>
          </motion.header>

          {!activeSection && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full"
            >
              {cards.map((card) => (
                <motion.div
                  key={card.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden"
                  onClick={() => setActiveSection(card.id)}
                >
                  <div className="p-8 flex flex-col items-center text-center">
                    <div className="mb-4 transform hover:rotate-12 transition-transform duration-300">
                      {card.icon}
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{card.title}</h3>
                    <p className="text-gray-600">{card.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {activeSection === 'ingestion' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-full mx-auto"
              >
                <button
                  onClick={() => {
                    // Refresh the page to clear all stored variables
                    window.location.reload();
                  }}
                  className="mb-6 flex items-center text-gray-600 hover:text-gray-800 text-lg"
                >
                  <FaArrowLeft className="mr-2" /> Back to Menu
                </button>
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h2 className="text-2xl font-semibold mb-6 flex items-center">
                    <FaCloudUploadAlt className="mr-3 text-blue-500" />
                    Data Ingestion
                  </h2>
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-full max-w-md">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload your data file
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="file-upload"
                        />
                        <label
                          htmlFor="file-upload"
                          className="w-full flex items-center justify-center px-6 py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 cursor-pointer transition-colors duration-300"
                        >
                          <FaCloudUploadAlt className="mr-2 text-2xl text-blue-500" />
                          <span className="text-gray-600">Choose a file or drag & drop</span>
                        </label>
                      </div>
                    </div>
                    {file && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-gray-600"
                      >
                        Selected file: {file.name}
                      </motion.div>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleIngestion}
                      disabled={!file || loading}
                      className={buttonStyles}
                    >
                      {loading ? 'Processing...' : 'Start Ingestion'}
                    </motion.button>
                  </div>

                  {ingestionResponse && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg">
                      <p className="text-green-700">Status: {ingestionResponse.Status}</p>
                      <p className="text-green-700">Message: {ingestionResponse.Message}</p>
                      {ingestionResponse.Hash && (
                        <p className="text-green-700">Hash: {ingestionResponse.Hash}</p>
                      )}
                      {ingestionResponse.Timestamp && (
                        <p className="text-green-700">Timestamp: {ingestionResponse.Timestamp}</p>
                      )}
                      {/* <p className="text-green-700">Ingestion ID: {ingestionResponse.IngestionId}</p>
                      <p className="text-green-700">Original Records: {ingestionResponse.OriginalRecords}</p> */}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeSection === 'forecast' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full"
              >
                <button
                  onClick={() => {
                    // Refresh the page to clear all stored variables
                    window.location.reload();
                  }}
                  className="mb-6 flex items-center text-gray-600 hover:text-gray-800 text-lg"
                >
                  <FaArrowLeft className="mr-2" /> Back to Menu
                </button>
                <div className="bg-white shadow-2xl rounded-2xl p-8 mb-8 w-full">
                  <h2 className="text-2xl font-semibold mb-6 flex items-center">
                    <FaBrain className="mr-3 text-purple-500 text-3xl" />
                    Forecast Parameters
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">MapActivity Id</label>
                      <input
                        type="text"
                        name="MapActivityId"
                        placeholder="Enter MapActivity Id"
                        value={forecastParams.MapActivityId}
                        onChange={handleForecastParamChange}
                        className={inputStyles}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Start Date</label>
                      <DatePicker
                        selected={forecastParams.StartDate ? new Date(forecastParams.StartDate) : null}
                        onChange={(date) => setForecastParams(prev => ({ ...prev, StartDate: date ? date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '-') : '' }))}
                        className={inputStyles}
                        placeholderText="MM/DD/YYYY"
                        dateFormat="MM/dd/yyyy"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Number of Days</label>
                      <input
                        type="number"
                        name="TotalNumberOfDays"
                        placeholder="Enter number of days"
                        value={forecastParams.TotalNumberOfDays}
                        onChange={handleForecastParamChange}
                        className={inputStyles}
                      />
                    </div>
                  </div>

                  <div className="mt-8 flex justify-center">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleGetForecast()}
                      disabled={loading}
                      className={buttonStyles}
                    >
                      {loading ? (
                        <span className="flex items-center">
                          <FaSyncAlt className="animate-spin mr-2" />
                          Processing...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <FaChartLine className="mr-2" />
                          Generate Forecast
                        </span>
                      )}
                    </motion.button>
                  </div>
                </div>

                {/* Error Display with enhanced styling */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-xl mb-8 shadow-md"
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-red-700 text-lg">{error}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Forecast Results */}
                {forecastData && (
                  <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                    <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-800">
                      <FaChartLine className="mr-3 text-amber-500" />
                      Forecast Dashboard
                    </h2>
                    
                    {/* Model Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      {forecastData.ForecastDemand?.map(result => {
                        const isHighestAccuracy = Math.max(...forecastData.ForecastDemand.map(r => r.ModelAccuracy)) === result.ModelAccuracy;
                        return (
                          <ModelCard
                            key={result.Model}
                            model={result.Model}
                            accuracy={result.ModelAccuracy}
                            isSelected={selectedModel === result.Model}
                            isHighest={isHighestAccuracy}
                            onClick={() => setSelectedModel(result.Model)}
                          />
                        );
                      })}
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 w-full">
                      {/* Interval Chart */}
                      <div className="bg-white p-6 rounded-xl shadow-md col-span-2">
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-800">Interval-wise Volume Distribution</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {selectedModel ? `Forecast for ${selectedModel}` : 'Select a model to view forecasts'}
                            </p>
                          </div>
                          <select
                            value={selectedDate || ''}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="p-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                          >
                            <option value="">Select Date</option>
                            {forecastData.ForecastDemand?.[0]?.ForecastedData.map(day => (
                              <option key={day.Date} value={day.Date}>
                                {moment(day.Date, 'MM-DD-YYYY').format('MMM DD, YYYY')}
                                {day.ImpactTag?.length > 0 ? ` (${day.ImpactTag[0].Holiday})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="h-[400px]">
                          {selectedModel && selectedDate ? (
                            (() => {
                              const chartData = prepareChartData(forecastData.ForecastDemand, selectedModel);
                              return chartData ? (
                                <Line
                                  data={chartData}
                                  options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                      legend: { position: 'top' },
                                      tooltip: {
                                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                        titleColor: '#000',
                                        bodyColor: '#666',
                                        borderColor: '#ddd',
                                        borderWidth: 1,
                                        callbacks: {
                                          label: function(context) {
                                            return `Volume: ${context.parsed.y.toLocaleString()}`;
                                          }
                                        }
                                      }
                                    },
                                    scales: {
                                      x: {
                                        title: {
                                          display: true,
                                          text: 'Time Interval'
                                        },
                                        ticks: {
                                          maxRotation: 45,
                                          minRotation: 45
                                        }
                                      },
                                      y: {
                                        title: {
                                          display: true,
                                          text: 'Volume'
                                        },
                                        beginAtZero: true
                                      }
                                    }
                                  }}
                                />
                              ) : (
                                <p className="text-center text-gray-500">No data available for selected date and model.</p>
                              );
                            })()
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <p className="text-gray-500">
                                {!selectedModel 
                                  ? 'Please select a model to view forecasts'
                                  : 'Please select a date to view the forecast'
                                }
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Growth Rate Section */}
                      {selectedModel && (
                        <div className="bg-white p-6 rounded-xl shadow-md col-span-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-800">Growth Rate Adjustment & Events</h3>
                              <p className="text-sm text-gray-500 mt-1">Apply growth rate & Events to adjust forecasts</p>
                            </div>
                            <button
                              onClick={() => setShowForecastParamsModal(true)}
                              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
                            >
                              Set Forecast Parameters
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Daily Volume Analysis - Full Width */}
                      <div className="bg-white p-6 rounded-xl shadow-md col-span-2">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800">Forecast Trends</h3>
                          <p className="text-sm text-gray-500 mt-1">Daily volume comparison across different models</p>
                        </div>
                        <div className="h-[400px]">
                          {prepareImpactAnalysisData(forecastData.ForecastDemand || []) ? (
                            <Line
                              data={prepareImpactAnalysisData(forecastData.ForecastDemand || [])}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                interaction: {
                                  mode: 'index',
                                  intersect: false,
                                },
                                plugins: {
                                  legend: { 
                                    display: true,
                                    position: 'top',
                                    align: 'end',
                                    labels: {
                                      boxWidth: 12,
                                      usePointStyle: true,
                                      pointStyle: 'circle',
                                      padding: 15,
                                      color: '#666'
                                    }
                                  },
                                  tooltip: {
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    titleColor: '#000',
                                    bodyColor: '#666',
                                    borderColor: '#ddd',
                                    borderWidth: 1,
                                    padding: 12,
                                    displayColors: false,
                                    callbacks: {
                                      label: function(context) {
                                        const dataset = context.dataset;
                                        const impactInfo = dataset.impactData[context.dataIndex];
                                        let label = `Volume: ${context.parsed.y.toLocaleString()}`;
                                        if (impactInfo.hasImpact) {
                                          label += ` (${impactInfo.impactTag})`;
                                        }
                                        return label;
                                      }
                                    }
                                  }
                                },
                                scales: {
                                  x: {
                                    title: {
                                      display: true,
                                      text: 'Date'
                                    },
                                    grid: {
                                      display: true,
                                      color: 'rgba(0,0,0,0.05)'
                                    },
                                    ticks: {
                                      maxRotation: 45,
                                      minRotation: 45
                                    }
                                  },
                                  y: {
                                    title: {
                                      display: true,
                                      text: 'Volume'
                                    },
                                    beginAtZero: true,
                                    grid: {
                                      display: true,
                                      color: 'rgba(0,0,0,0.05)'
                                    },
                                    ticks: {
                                      maxRotation: 45,
                                      minRotation: 45,
                                      padding: 8,
                                      font: {
                                        size: 10,
                                        color: '#666'
                                      }
                                    },
                                    border: {
                                      display: false
                                    }
                                  }
                                },
                                elements: {
                                  line: {
                                    tension: 0.4,
                                    borderWidth: 2
                                  },
                                  point: {
                                    radius: 3,
                                    hoverRadius: 6
                                  }
                                }
                              }}
                            />
                          ) : (
                            <p className="text-center text-gray-500">No forecast trend data available.</p>
                          )}
                        </div>
                      </div>

                      {selectedDate && (
                        <>
                          {/* Daily Pattern Analysis */}
                          <div className="bg-white p-6 rounded-xl shadow-md">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-800">Daily Pattern Analysis</h3>
                              <p className="text-sm text-gray-500 mt-1">Volume distribution throughout the day</p>
                            </div>
                            <div className="h-[400px]">
                              {prepareDailyPatternData(forecastData.ForecastDemand || []) ? (
                                <Line
                                  data={prepareDailyPatternData(forecastData.ForecastDemand || [])}
                                  options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                      legend: { position: 'top' },
                                      title: { display: false }
                                    },
                                    scales: {
                                      x: {
                                        title: {
                                          display: true,
                                          text: 'Time Interval'
                                        },
                                        ticks: {
                                          maxRotation: 45,
                                          minRotation: 45
                                        }
                                      },
                                      y: {
                                        title: {
                                          display: true,
                                          text: 'Volume'
                                        },
                                        beginAtZero: true
                                      }
                                    }
                                  }}
                                />
                              ) : (
                                <p className="text-center text-gray-500">No pattern data available.</p>
                              )}
                            </div>
                          </div>

                          {/* Model Comparison */}
                          <div className="bg-white p-6 rounded-xl shadow-md">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-800">Weekly Volume Trend</h3>
                              <p className="text-sm text-gray-500 mt-1">Weekly volume distribution over time</p>
                            </div>
                            <div className="h-[400px]">
                              {(() => {
                                if (!forecastData?.ForecastDemand?.[0]?.ForecastedData) {
                                  return <p className="text-center text-gray-500">No weekly trend data available.</p>;
                                }

                                // Get the forecast data from the selected model or first model
                                const modelData = selectedModel 
                                  ? forecastData.ForecastDemand.find(m => m.Model === selectedModel)
                                  : forecastData.ForecastDemand[0];

                                if (!modelData) return null;

                                // Group data by weeks and calculate total volumes
                                const weeklyData = modelData.ForecastedData.reduce((acc, day) => {
                                  const date = moment(day.Date, 'MM-DD-YYYY');
                                  const weekStart = date.startOf('week').format('MMM DD');
                                  
                                  // Calculate total volume for the day
                                  const dailyVolume = day.Forecasts.reduce((sum, f) => sum + f.Volume, 0);
                                  
                                  // Find or create week entry
                                  const weekEntry = acc.find(w => w.weekStart === weekStart);
                                  if (weekEntry) {
                                    weekEntry.volume += dailyVolume;
                                  } else {
                                    acc.push({
                                      weekStart,
                                      volume: dailyVolume
                                    });
                                  }
                                  
                                  return acc;
                                }, []);

                                // Sort by week start date
                                weeklyData.sort((a, b) => 
                                  moment(a.weekStart, 'MMM DD').valueOf() - 
                                  moment(b.weekStart, 'MMM DD').valueOf()
                                );

                                const chartData = {
                                  labels: weeklyData.map(d => d.weekStart),
                                  datasets: [{
                                    label: 'Weekly Volume',
                                    data: weeklyData.map(d => d.volume),
                                    borderColor: 'rgb(45, 206, 204)',
                                    backgroundColor: 'rgba(45, 206, 204, 0.1)',
                                    fill: true,
                                    tension: 0.3,
                                    borderWidth: 1.5,
                                    pointRadius: 2,
                                    pointBackgroundColor: 'rgb(45, 206, 204)',
                                    pointBorderColor: 'rgb(45, 206, 204)',
                                    pointHoverRadius: 4,
                                    pointHoverBackgroundColor: 'rgb(45, 206, 204)',
                                    pointHoverBorderColor: '#fff',
                                    pointHoverBorderWidth: 2
                                  }]
                                };

                                return (
                                  <Line
                                    data={chartData}
                                    options={{
                                      responsive: true,
                                      maintainAspectRatio: false,
                                      plugins: {
                                        legend: { position: 'top' },
                                        tooltip: {
                                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                          titleColor: '#000',
                                          bodyColor: '#666',
                                          borderColor: '#ddd',
                                          borderWidth: 1,
                                          padding: 12,
                                          callbacks: {
                                            label: function(context) {
                                              return `Volume: ${context.parsed.y.toLocaleString()}`;
                                            }
                                          }
                                        }
                                      },
                                      scales: {
                                        x: {
                                          grid: {
                                            display: true,
                                            color: 'rgba(0,0,0,0.05)',
                                            drawBorder: false
                                          },
                                          ticks: {
                                            maxRotation: 45,
                                            minRotation: 45
                                          }
                                        },
                                        y: {
                                          beginAtZero: true,
                                          grid: {
                                            display: true,
                                            color: 'rgba(0,0,0,0.05)',
                                            drawBorder: false
                                          },
                                          ticks: {
                                            font: {
                                              size: 11,
                                              color: '#666'
                                            },
                                            padding: 8,
                                            callback: function(value) {
                                              return value.toLocaleString();
                                            }
                                          },
                                          border: {
                                            display: false
                                          }
                                        }
                                      },
                                      elements: {
                                        line: {
                                          tension: 0.3
                                        }
                                      },
                                      interaction: {
                                        intersect: false,
                                        mode: 'index'
                                      }
                                    }}
                                  />
                                );
                              })()}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Volume Statistics */}
                      {!plotLoading && !plotError && plotData && plotData.PlotData && (
                        <div className="bg-white p-6 rounded-xl shadow-md col-span-2 mb-8">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                            {(() => {
                              const plotDataItems = plotData.PlotData;
                              const historicalData = plotDataItems.filter(item => item.Type === "Historical");
                              const forecastedData = plotDataItems.filter(item => item.Type === "Forecasted");
                              
                              const historicalSum = historicalData.reduce((sum, item) => sum + item.Volume, 0);
                              
                              // For the 2024 forecasted volume display, we always use the original data
                              // This ensures the 2024 volume remains unchanged when growth rate is applied
                              let forecastedSum;
                              
                              // Check if we're viewing data with growth rate applied
                              const hasGrowthRateApplied = plotData.HasGrowthRateApplied || plotData.OriginalForecastData;
                                
                              if (hasGrowthRateApplied && plotData.OriginalForecastData) {
                                // Use the original forecast data for the 2024 volume display
                                forecastedSum = plotData.OriginalForecastData.reduce((sum, item) => sum + item.Volume, 0);
                              } else {
                                // No growth rate applied, use current forecast data
                                forecastedSum = forecastedData.reduce((sum, item) => sum + item.Volume, 0);
                              }
                              
                              const volumeChange = forecastedSum - historicalSum;
                              const percentageChange = historicalSum ? ((volumeChange / historicalSum) * 100).toFixed(2) : 0;
                              
                              return (
                                <>
                                  <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                                    <p className="text-sm font-medium text-gray-600">Historical Volume ({plotData.Year})</p>
                                    <p className="text-xl font-bold mt-1 text-gray-800">{historicalSum.toLocaleString()}</p>
                                  </div>
                                  <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                                    <p className="text-sm font-medium text-gray-600">Forecasted Volume (2024)</p>
                                    <p className="text-xl font-bold mt-1 text-gray-800">{forecastedSum.toLocaleString()}</p>
                                  </div>
                                  <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                                    <p className="text-sm font-medium text-gray-600">Volume Change</p>
                                    <p className={`text-xl font-bold mt-1 ${parseFloat(percentageChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {percentageChange}%
                                    </p>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Historical vs Forecast Comparison - Full Width */}
                    {historicalVsForecastData && (
                      <div className="bg-white p-6 rounded-xl shadow-md col-span-2">
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-800">Historical vs Forecast Comparison</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              Compare historical data with forecasted volumes
                            </p>
                          </div>
                          <select
                            value={selectedYear}
                            onChange={(e) => {
                              setSelectedYear(e.target.value);
                              // Fetch new data when year changes
                              if (forecastData && selectedModel) {
                                fetchHistoricalVsForecastData(
                                  forecastParams.MapActivityId,
                                  e.target.value,
                                  selectedModel
                                );
                              }
                            }}
                            className="p-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                          >
                            {yearOptions.map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                        </div>
                        <div className="h-[400px]">
                          {(() => {
                            const chartData = prepareHistoricalVsForecastChart(historicalVsForecastData);
                            return chartData ? (
                              <Line
                                data={chartData}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: { position: 'top' },
                                    tooltip: {
                                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                      titleColor: '#000',
                                      bodyColor: '#666',
                                      borderColor: '#ddd',
                                      borderWidth: 1,
                                      padding: 12,
                                      callbacks: {
                                        label: function(context) {
                                          return `Volume: ${context.parsed.y.toLocaleString()}`;
                                        }
                                      }
                                    }
                                  },
                                  scales: {
                                    x: {
                                      title: {
                                        display: true,
                                        text: 'Date'
                                      },
                                      ticks: {
                                        maxRotation: 45,
                                        minRotation: 45
                                      }
                                    },
                                    y: {
                                      title: {
                                        display: true,
                                        text: 'Volume'
                                      },
                                      beginAtZero: true
                                    }
                                  }
                                }}
                              />
                            ) : (
                              <p className="text-center text-gray-500">No comparison data available.</p>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Forecast Parameters Modal */}
                <ForecastParamsModal
                  isOpen={showForecastParamsModal}
                  onClose={() => setShowForecastParamsModal(false)}
                  onApply={async () => {
                    try {
                      // Create base params
                      const params = {
                        MapActivityId: forecastParams.MapActivityId,
                        StartDate: forecastParams.StartDate,
                        TotalNumberOfDays: forecastParams.TotalNumberOfDays,
                        ModelName: selectedModel
                      };

                      // Add growth rate if parameters are provided
                      if (growthRateParams.From && growthRateParams.To && growthRateParams.Rate !== null) {
                        params.GrowthRate = {
                          From: moment(growthRateParams.From).format('MM/DD/YYYY'),
                          To: moment(growthRateParams.To).format('MM/DD/YYYY'),
                          Rate: parseFloat(growthRateParams.Rate)
                        };
                      }

                      // Add events if any are provided
                      if (events.length > 0) {
                        params.Events = events;
                      }

                      await handleGetForecast(params);
                      setShowForecastParamsModal(false);
                    } catch (error) {
                      console.error('Error applying forecast parameters:', error);
                      setError('Failed to apply forecast parameters');
                    }
                  }}
                  growthRateParams={growthRateParams}
                  setGrowthRateParams={setGrowthRateParams}
                  events={events}
                  setEvents={setEvents}
                />

                {/* Historical vs Forecast Plot - Full Width */}
                <div className="bg-white p-6 rounded-xl shadow-md col-span-2">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">Historical vs Forecast Plot</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Compare historical data with forecasted volumes
                      </p>
                    </div>
                    <select
                      value={selectedYear}
                      onChange={(e) => {
                        setSelectedYear(e.target.value);
                        // This will trigger the useEffect to fetch new plot data
                        if (forecastData && selectedModel) {
                          fetchHistoricalVsForecastData(
                            forecastParams.MapActivityId,
                            e.target.value,
                            selectedModel
                          );
                        }
                      }}
                      className="p-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                    >
                      {yearOptions.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  
                  {plotLoading && (
                    <div className="flex justify-center items-center h-[400px]">
                      <div className="flex items-center space-x-2">
                        <FaSyncAlt className="animate-spin text-amber-500" />
                        <span className="text-gray-600">Loading plot data...</span>
                      </div>
                    </div>
                  )}
                  
                  {plotError && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                      <p className="text-red-700">{plotError}</p>
                    </div>
                  )}
                  
                  {!plotLoading && !plotError && plotData && (
                    <div className="h-[400px]">
                      {(() => {
                        const chartData = preparePlotChartData(plotData);
                        return chartData ? (
                          <Line
                            data={chartData}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: { position: 'top' },
                                tooltip: {
                                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                  titleColor: '#000',
                                  bodyColor: '#666',
                                  borderColor: '#ddd',
                                  borderWidth: 1,
                                  padding: 12,
                                  displayColors: false,
                                  callbacks: {
                                    label: function(context) {
                                      return `Volume: ${context.parsed.y.toLocaleString()}`;
                                    }
                                  }
                                }
                              },
                              scales: {
                                x: {
                                  title: {
                                    display: true,
                                    text: 'Date'
                                  },
                                  ticks: {
                                    maxRotation: 45,
                                    minRotation: 45
                                  }
                                },
                                y: {
                                  title: {
                                    display: true,
                                    text: 'Volume'
                                  },
                                  beginAtZero: true
                                }
                              }
                            }}
                          />
                        ) : (
                          <p className="text-center text-gray-500">No plot data available.</p>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Home;