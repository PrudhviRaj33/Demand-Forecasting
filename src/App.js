import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import { SidebarProvider } from './context/SidebarContext';
import './index.css';

// Import the Home component
import Home from './components/home'; // Adjust path based on your directory structure

const App = () => {
  return (
    <SidebarProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          {/* Add TopBar here */}
          <TopBar />
          
          <div className="flex flex-grow">
            <Sidebar />
            <div className="flex-grow p-6">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/discover" element={<Discover />} />
                <Route path="/library" element={<Library />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
              </Routes>
            </div>
          </div>
        </div>
      </Router>
    </SidebarProvider>
  );
};

// Dummy components for routing
const Discover = () => <div>Discover Page</div>;
const Library = () => <div>Library Page</div>;
const SignIn = () => <div>Sign In Page</div>;
const SignUp = () => <div>Sign Up Page</div>;

export default App;
