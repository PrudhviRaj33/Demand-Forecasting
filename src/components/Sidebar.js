import { useContext, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaGripHorizontal } from 'react-icons/fa';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md';
import { SidebarContext } from '../context/SidebarContext';

const sidebarItems = [
    { name: "Home", href: "/", icon: FaGripHorizontal }, // Grid-like icon for Home
];

const Sidebar = () => {
  const location = useLocation();
  const { isCollapsed, toggleSidebarCollapse, setIsCollapsed } = useContext(SidebarContext);
  const sidebarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsCollapsed(true);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setIsCollapsed]);

  return (
    <div ref={sidebarRef} className={`fixed top-0 left-0 ${isCollapsed ? "w-15" : "w-40"} h-screen bg-gray-100 transition-all overflow-hidden z-0`}>
      <aside className="flex flex-col h-full">
        <ul className="flex flex-col space-y-2 mt-6">
          {sidebarItems.map(({ name, href, icon: Icon }) => (
            <li key={name} className="flex mt-24">
              <Link
                to={href}
                className={`flex items-center p-3 text-gray-700 ml-2 mr-2 hover:bg-gray-200 rounded-md transition-colors w-full ${ // Added mr-2 here
                  location.pathname === href ? "bg-red-500 text-white" : ""
                } ${isCollapsed ? "justify-center" : ""}`}
              >
                <Icon className="h-5 w-6" />
                {!isCollapsed && <span className="ml-2">{name}</span>}
              </Link>
            </li>
          ))}
        </ul>
        <button className="p-2 focus:outline-none mt-auto" onClick={toggleSidebarCollapse}>
          {isCollapsed ? <MdKeyboardArrowRight /> : <MdKeyboardArrowLeft />}
        </button>
      </aside>
    </div>
  );
};

export default Sidebar;
