import React, { useState, useEffect } from "react";
import {
  Clock,
  Package,
  DollarSign,
  Users,
  Plus,
  Search,
  X,
  Check,
  LogOut,
  LogIn,
  Upload,
  Camera,
  Settings,
  Menu,
  ChevronDown,
  ChevronUp,
  QrCode,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import API from "./api";

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

const DEFAULT_ADMIN_USERNAME = "tina";
const DEFAULT_ADMIN_PASSWORD = "pepperpanicvintage";

const formatCurrency = (amount) => `₪${amount.toFixed(2)}`;
const formatTime = (date) =>
  new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
const formatDuration = (startTime, endTime) => {
  const diffMs = new Date(endTime) - new Date(startTime);
  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};
const calculateHoursWorked = (startTime, endTime) =>
  (new Date(endTime) - new Date(startTime)) / 3600000;
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const CATEGORIES = ["Top", "Bottom", "Shoe", "Jacket", "Dress"];
const PAYMENT_METHODS = ["cash", "paybox", "bit", "bank_transfer"];

// =============================================================================
// MAIN APPLICATION COMPONENT
// =============================================================================

function App() {
  const [currentScreen, setCurrentScreen] = useState("login");
  const [currentUser, setCurrentUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [sales, setSales] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [paymentInfo, setPaymentInfo] = useState({
    bit: { name: "", phone: "" },
    paybox: { name: "", phone: "" },
    bank_transfer: {
      name: "",
      bankName: "",
      bankNumber: "",
      branchNumber: "",
      accountNumber: "",
    },
  });
  const [audits, setAudits] = useState([]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    const [
      employeesData,
      inventoryData,
      salesData,
      shiftsData,
      paymentInfoData,
      auditsData,
    ] = await Promise.all([
      API.employees.getAll(),
      API.inventory.getAll(),
      API.sales.getAll(),
      API.shifts.getAll(),
      API.paymentInfo.get(),
      API.audits.getAll(),
    ]);
    setEmployees(employeesData);
    setInventory(inventoryData);
    setSales(salesData);
    setShifts(shiftsData);
    setPaymentInfo(paymentInfoData);
    setAudits(auditsData);
  };

  const addEmployee = async (name, role = "employee") => {
    const newEmployee = {
      id: Date.now().toString(),
      name,
      role,
      hourly_rate: 0,
      commission_rate: 0,
      payment_tiers: [{ minSales: 0, maxSales: null, type: "hourly_only" }],
      qr_code: `EMP-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    await API.employees.create(newEmployee);
    setEmployees([...employees, newEmployee]);
    return newEmployee;
  };

  const updateEmployee = async (id, updates) => {
    await API.employees.update(id, updates);
    setEmployees(
      employees.map((emp) => (emp.id === id ? { ...emp, ...updates } : emp))
    );
  };

  const deleteEmployee = async (id) => {
    await API.employees.delete(id);
    setEmployees(employees.filter((emp) => emp.id !== id));
  };

  const checkIn = async (employeeId) => {
    const newShift = {
      id: Date.now().toString(),
      employeeId,
      check_in_time: new Date().toISOString(),
      check_out_time: null,
      active: true,
    };
    await API.shifts.create(newShift);
    setShifts([...shifts, newShift]);
  };

  const checkOut = async (shiftId) => {
    const updates = { checkOutTime: new Date().toISOString(), active: false };
    await API.shifts.update(shiftId, updates);
    setShifts(
      shifts.map((shift) =>
        shift.id === shiftId ? { ...shift, ...updates } : shift
      )
    );
  };

  const getActiveShift = (employeeId) => {
    const shift = shifts.find((s) => s.employeeId === employeeId && s.active);
    // console.log({ shift });
    return shift;
  };

  const addInventoryItem = async (item) => {
    const newItem = {
      ...item,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    };
    await API.inventory.create(newItem);
    setInventory([...inventory, newItem]);
    return newItem;
  };

  const updateInventoryItem = async (id, updates) => {
    await API.inventory.update(id, updates);
    setInventory(
      inventory.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const deleteInventoryItem = async (id) => {
    await API.inventory.delete(id);
    setInventory(inventory.filter((item) => item.id !== id));
  };

  const decrementInventory = async (itemId, quantity) => {
    const item = inventory.find((i) => i.id === itemId);
    if (item) {
      await updateInventoryItem(itemId, {
        quantity: Math.max(0, item.quantity - quantity),
      });
    }
  };

  const addSale = async (saleData) => {
    const newSale = {
      ...saleData,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    await API.sales.create(newSale);
    setSales([...sales, newSale]);
    for (const item of saleData.items) {
      if (item.existingItemId)
        await decrementInventory(item.existingItemId, item.quantity);
    }
  };

  const updatePaymentInfo = async (info) => {
    await API.paymentInfo.update(info);
    setPaymentInfo(info);
  };

  const createAudit = async (auditData) => {
    const newAudit = {
      ...auditData,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    await API.audits.create(newAudit);
    setAudits([...audits, newAudit]);
  };

  const calculateShiftPayment = (shift, employee) => {
    const isActive = !shift.check_out_time;
    const endTime = isActive ? new Date() : new Date(shift.check_out_time);
    const hoursWorked = calculateHoursWorked(shift.check_in_time, endTime);
    const hourlyPay = hoursWorked * (employee.hourly_rate || 0);

    const shiftSales = sales.filter((sale) => {
      const saleTime = new Date(sale.timestamp);
      const shiftStart = new Date(shift.check_in_time);
      return (
        sale.employeeId === employee.id &&
        saleTime >= shiftStart &&
        (!shift.check_out_time || saleTime <= endTime)
      );
    });

    const totalSales = shiftSales.reduce((sum, sale) => sum + sale.total, 0);
    let commission = 0;
    let paymentTier = "base_only";
    let activeTierIndex = -1;

    if (employee.payment_tiers && employee.payment_tiers.length > 0) {
      const tierIndex = employee.payment_tiers.findIndex((t) => {
        const meetsMin = totalSales >= (t.minSales || 0);
        const meetsMax = t.maxSales === null || totalSales <= t.maxSales;
        return meetsMin && meetsMax;
      });

      if (tierIndex >= 0) {
        activeTierIndex = tierIndex;
        const tier = employee.payment_tiers[tierIndex];
        if (tier.type === "hourly_plus_commission") {
          commission =
            totalSales *
            ((tier.commission_rate || employee.commission_rate || 0) / 100);
          paymentTier = `${
            tier.commission_rate || employee.commission_rate
          }% commission`;
        } else {
          paymentTier = "base_only";
        }
      }
    } else {
      commission = totalSales * ((employee.commission_rate || 0) / 100);
      paymentTier =
        employee.commission_rate > 0
          ? `${employee.commission_rate}% commission`
          : "base_only";
    }

    return {
      hourlyPay,
      commission,
      total: hourlyPay + commission,
      hoursWorked,
      salesCount: shiftSales.length,
      salesTotal: totalSales,
      paymentTier,
      activeTierIndex,
    };
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentScreen("login");
  };

  // =============================================================================
  // UI COMPONENTS
  // =============================================================================
  const Login = () => {
    const [qrInput, setQrInput] = useState("");
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [adminUsername, setAdminUsername] = useState("");
    const [adminPassword, setAdminPassword] = useState("");

    const handleLogin = () => {
      const employee = employees.find((e) => e.qr_code === qrInput);
      if (employee) {
        setCurrentUser(employee);
        setCurrentScreen("dashboard");
      } else {
        alert("Invalid QR code");
      }
    };

    const handleAdminLogin = () => {
      if (
        adminUsername === DEFAULT_ADMIN_USERNAME &&
        DEFAULT_ADMIN_PASSWORD === DEFAULT_ADMIN_PASSWORD
      ) {
        setCurrentUser({ id: "admin", name: "Tina", role: "admin" });
        setCurrentScreen("dashboard");
      } else {
        alert("Invalid credentials");
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <Package className="w-16 h-16 mx-auto text-blue-600 mb-4" />
            <h1 className="text-3xl font-bold text-gray-800">
              Pepper Panic Vintage
            </h1>
            <p className="text-gray-600">Management System</p>
          </div>

          {!showAdminLogin ? (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Employee QR Code
                  </label>
                  <input
                    type="text"
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                    className="w-full p-3 border rounded-lg"
                    placeholder="Scan or enter QR code"
                  />
                </div>
                <button
                  onClick={handleLogin}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
                >
                  Login as Employee
                </button>
                <button
                  onClick={() => setShowAdminLogin(true)}
                  className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300"
                >
                  Admin Login
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={adminUsername}
                    onChange={(e) =>
                      setAdminUsername(e.target.value.trim().toLowerCase())
                    }
                    className="w-full p-3 border rounded-lg"
                    placeholder="admin"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAdminLogin()}
                    className="w-full p-3 border rounded-lg"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <button
                onClick={handleAdminLogin}
                className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 mb-3"
              >
                Login as Admin
              </button>
              <button
                onClick={() => {
                  setShowAdminLogin(false);
                  setAdminUsername("");
                  setAdminPassword("");
                }}
                className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300"
              >
                Back
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const NavigationMenu = () => {
    const isAdmin = currentUser?.role === "admin";

    const menuItems = [
      { label: "Dashboard", screen: "dashboard", icon: Package, show: true },
      { label: "Check In/Out", screen: "checkin", icon: LogIn, show: true },
      { label: "Inventory", screen: "inventory", icon: Package, show: true },
      { label: "Record Sale", screen: "sales", icon: DollarSign, show: true },
      {
        label: "Inventory Audit",
        screen: "audit",
        icon: CheckCircle,
        show: true,
      },
      { label: "Sales Log", screen: "saleslog", icon: Clock, show: true },
      {
        label: "Payment Info",
        screen: "paymentinfo",
        icon: DollarSign,
        show: true,
      },
      {
        label: "My Payments",
        screen: "mypayments",
        icon: DollarSign,
        show: !isAdmin,
      },
      { label: "My Shifts", screen: "myshifts", icon: Users, show: !isAdmin },
      {
        label: "All Payments",
        screen: "payments",
        icon: DollarSign,
        show: isAdmin,
      },
      {
        label: "Shift History",
        screen: "shiftlog",
        icon: Users,
        show: isAdmin,
      },
      {
        label: "Manage Employees",
        screen: "manageemployees",
        icon: Users,
        show: isAdmin,
      },
    ];

    return (
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">
            Pepper Panic Vintage Management System
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{currentUser?.name}</span>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {showMenu && (
          <div className="absolute right-4 top-16 bg-white border rounded-lg shadow-lg z-50 w-64">
            <div className="p-2">
              {menuItems
                .filter((item) => item.show)
                .map((item) => (
                  <button
                    key={item.screen}
                    onClick={() => {
                      setCurrentScreen(item.screen);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg text-left"
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                ))}
              <div className="border-t my-2"></div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-red-600 rounded-lg text-left"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const Dashboard = () => {
    const activeShifts = shifts.filter((s) => s.active);
    const todaySales = sales.filter(
      (s) => new Date(s.timestamp).toDateString() === new Date().toDateString()
    );
    const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    const lowStockItems = inventory.filter(
      (item) => item.quantity <= 2 && item.quantity > 0
    );
    const isAdmin = currentUser?.role === "admin";

    return (
      <div className="p-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold">Active Employees</h3>
            </div>
            <p className="text-3xl font-bold">{activeShifts.length}</p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold">Today's Revenue</h3>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(todayRevenue)}</p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold">Total Items</h3>
            </div>
            <p className="text-3xl font-bold">{inventory.length}</p>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold">Today's Sales</h3>
            </div>
            <p className="text-3xl font-bold">{todaySales.length}</p>
          </div>
        </div>

        {isAdmin && activeShifts.length > 0 && (
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border-2 border-teal-300 rounded-lg p-4 mb-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Current Employee Payments (Active Shifts)
            </h2>
            <div className="space-y-3">
              {activeShifts.map((shift) => {
                const employee = employees.find(
                  (e) => e.id === shift.employeeId
                );
                if (!employee) return null;
                const payment = calculateShiftPayment(shift, employee);

                return (
                  <div
                    key={shift.id}
                    className="bg-white rounded-lg p-4 border border-teal-200"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bold text-lg">{employee.name}</p>
                        <p className="text-sm text-gray-600">
                          Started: {formatTime(shift.check_in_time)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {payment.hoursWorked.toFixed(2)} hours worked
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-teal-600">
                          {formatCurrency(payment.total)}
                        </p>
                        <p className="text-xs text-gray-600">
                          {payment.paymentTier}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm bg-gray-50 p-2 rounded">
                      <div>
                        <p className="text-gray-600 text-xs">Base Pay</p>
                        <p className="font-semibold">
                          {formatCurrency(payment.hourlyPay)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs">Commission</p>
                        <p className="font-semibold">
                          {formatCurrency(payment.commission)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs">Sales Made</p>
                        <p className="font-semibold">
                          {payment.salesCount} (
                          {formatCurrency(payment.salesTotal)})
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {lowStockItems.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Low Stock Alert</h3>
            <div className="space-y-1">
              {lowStockItems.map((item) => (
                <p key={item.id} className="text-sm">
                  {item.name} - Only {item.quantity} left
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Inventory List with Grouping
  const InventoryList = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("name");
    const [sortOrder, setSortOrder] = useState("asc");
    const [editingItem, setEditingItem] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState("all");

    let filteredInventory = inventory.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.variation &&
          item.variation.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (selectedCategory !== "all") {
      filteredInventory = filteredInventory.filter(
        (item) => item.category === selectedCategory
      );
    }

    filteredInventory.sort((a, b) => {
      const multiplier = sortOrder === "asc" ? 1 : -1;
      if (sortBy === "name") return multiplier * a.name.localeCompare(b.name);
      if (sortBy === "quantity") return multiplier * (a.quantity - b.quantity);
      return 0;
    });

    // Group by category
    const groupedInventory = CATEGORIES.reduce((acc, category) => {
      acc[category] = filteredInventory.filter(
        (item) => item.category === category
      );
      return acc;
    }, {});

    if (editingItem) {
      return (
        <InventoryForm
          item={editingItem}
          onSave={async (updates) => {
            await updateInventoryItem(editingItem.id, updates);
            setEditingItem(null);
          }}
          onCancel={() => setEditingItem(null)}
        />
      );
    }

    const isAdmin = currentUser?.role === "admin";

    return (
      <div className="p-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Inventory</h1>

        <div className="mb-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search inventory..."
              className="w-full pl-10 pr-4 py-3 border rounded-lg"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex-1 p-2 border rounded-lg"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 p-2 border rounded-lg"
            >
              <option value="name">Sort by Name</option>
              <option value="quantity">Sort by Quantity</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="p-2 border rounded-lg hover:bg-gray-50"
            >
              {sortOrder === "asc" ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-6 mb-6">
          {CATEGORIES.map((category) => {
            const items = groupedInventory[category];
            if (
              items.length === 0 &&
              selectedCategory !== "all" &&
              selectedCategory !== category
            )
              return null;

            return (
              <div key={category}>
                <h2 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                    {category}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({items.length} items)
                  </span>
                </h2>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border rounded-lg p-4 flex gap-4"
                    >
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.name}</h3>
                        {item.variation && (
                          <p className="text-sm text-gray-600">
                            {item.variation}
                          </p>
                        )}
                        {item.description && (
                          <p className="text-sm text-gray-500 mt-1">
                            {item.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-lg font-bold">
                            {formatCurrency(item.price)}
                          </span>
                          <span
                            className={`text-sm ${
                              item.quantity === 0
                                ? "text-red-600 font-semibold"
                                : "text-gray-600"
                            }`}
                          >
                            Qty: {item.quantity}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="text-blue-600 hover:text-blue-700 px-4"
                        >
                          Edit
                        </button>
                        {isAdmin && (
                          <button
                            onClick={async () => {
                              if (window.confirm(`Delete "${item.name}"?`)) {
                                await deleteInventoryItem(item.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-700 px-4"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <p className="text-center text-gray-400 py-4">
                      No items in this category
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => setCurrentScreen("additem")}
          className="w-full bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add New Item
        </button>
      </div>
    );
  };

  // Inventory Audit Component
  const InventoryAudit = () => {
    const isAdmin = currentUser?.role === "admin";
    const [auditStatus, setAuditStatus] = useState({});
    const [notes, setNotes] = useState("");

    const handleToggleItem = (itemId) => {
      setAuditStatus((prev) => ({
        ...prev,
        [itemId]: !prev[itemId],
      }));
    };

    const handleCompleteAudit = async () => {
      const checkedItems = Object.keys(auditStatus).filter(
        (id) => auditStatus[id]
      );
      const missingItems = inventory.filter((item) => !auditStatus[item.id]);

      await createAudit({
        performed_by: currentUser.id,
        performer_name: currentUser.name,
        checked_items: checkedItems.length,
        missing_items: missingItems.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
        })),
        notes,
      });

      alert("Audit completed successfully!");
      setAuditStatus({});
      setNotes("");
    };

    // Group by category
    const groupedInventory = CATEGORIES.reduce((acc, category) => {
      acc[category] = inventory.filter((item) => item.category === category);
      return acc;
    }, {});

    const totalItems = inventory.length;
    const checkedItems = Object.values(auditStatus).filter(Boolean).length;
    const missingItems = inventory.filter((item) => !auditStatus[item.id]);

    return (
      <div className="p-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Inventory Audit</h1>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700 mb-2">
            Review all inventory items and mark each as "In Stock" to verify
            physical inventory matches the system.
          </p>
          <div className="flex justify-between text-sm font-semibold">
            <span>
              Progress: {checkedItems} / {totalItems} items checked
            </span>
            <span className="text-blue-600">
              {((checkedItems / totalItems) * 100).toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(checkedItems / totalItems) * 100}%` }}
            ></div>
          </div>
        </div>

        {missingItems.length > 0 && isAdmin && (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h3 className="font-bold text-red-800">
                Missing Items ({missingItems.length})
              </h3>
            </div>
            <div className="space-y-2">
              {missingItems.map((item) => (
                <div key={item.id} className="text-sm">
                  <span className="font-semibold">{item.name}</span>
                  <span className="text-gray-600"> ({item.category})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-6 mb-6">
          {CATEGORIES.map((category) => {
            const items = groupedInventory[category];
            if (items.length === 0) return null;

            const categoryChecked = items.filter(
              (item) => auditStatus[item.id]
            ).length;

            return (
              <div key={category}>
                <h2 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                    {category}
                  </span>
                  <span className="text-sm text-gray-500">
                    {categoryChecked} / {items.length} checked
                  </span>
                </h2>
                <div className="space-y-2">
                  {items.map((item) => {
                    const isChecked = auditStatus[item.id];
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleToggleItem(item.id)}
                        className={`border rounded-lg p-4 flex items-center gap-4 cursor-pointer transition-all ${
                          isChecked
                            ? "bg-green-50 border-green-500"
                            : "bg-white hover:bg-gray-50"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                            isChecked
                              ? "bg-green-500 border-green-500"
                              : "border-gray-300"
                          }`}
                        >
                          {isChecked && (
                            <Check className="w-4 h-4 text-white" />
                          )}
                        </div>
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.name}</h3>
                          {item.variation && (
                            <p className="text-sm text-gray-600">
                              {item.variation}
                            </p>
                          )}
                          <p className="text-sm text-gray-500">
                            Expected Qty: {item.quantity}
                          </p>
                        </div>
                        {isChecked && (
                          <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                            In Stock
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2">
            Audit Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-3 border rounded-lg"
            rows="3"
            placeholder="Add any notes about discrepancies or observations..."
          />
        </div>

        <button
          onClick={handleCompleteAudit}
          disabled={checkedItems === 0}
          className="w-full bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-5 h-5" />
          Complete Audit
        </button>
      </div>
    );
  };

  // Check In/Out
  const CheckInOut = () => {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Check In/Out</h1>
        <div className="space-y-3">
          {employees.map((emp) => {
            const activeShift = getActiveShift(emp.id);
            return (
              <div
                key={emp.id}
                className="bg-white border rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold">{emp.name}</p>
                  {activeShift && (
                    <p className="text-sm text-gray-600">
                      Checked in at {formatTime(activeShift.check_in_time)}
                    </p>
                  )}
                </div>
                {activeShift ? (
                  <button
                    onClick={() => checkOut(activeShift.id)}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Check Out
                  </button>
                ) : (
                  <button
                    onClick={() => checkIn(emp.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    Check In
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // My Payments (Employee View)
  const MyPayments = () => {
    const activeShift = getActiveShift(currentUser.id);
    const payment = activeShift
      ? calculateShiftPayment(activeShift, currentUser)
      : null;

    return (
      <div className="p-4 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">My Payments</h1>

        {activeShift && payment && (
          <div className="bg-teal-50 border-2 border-teal-500 rounded-lg p-6 mb-6">
            <h2 className="font-bold text-lg mb-4">Current Shift (Active)</h2>
            <p className="text-sm text-gray-600 mb-4">
              Started at {formatTime(activeShift.check_in_time)}
            </p>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-700">Hours Worked</span>
                <span className="font-semibold">
                  {payment.hoursWorked.toFixed(2)} hrs
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-700">
                  Base Pay ({formatCurrency(currentUser.hourly_rate)}/hr)
                </span>
                <span className="font-semibold text-blue-600">
                  {formatCurrency(payment.hourlyPay)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-700">Sales Made</span>
                <span className="font-semibold">
                  {payment.salesCount} sales (
                  {formatCurrency(payment.salesTotal)})
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-700">
                  Commission ({payment.paymentTier})
                </span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(payment.commission)}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 bg-teal-100 px-3 rounded">
                <span className="font-bold text-lg">Total Earnings</span>
                <span className="font-bold text-2xl text-teal-700">
                  {formatCurrency(payment.total)}
                </span>
              </div>
            </div>
          </div>
        )}

        <h2 className="font-bold text-lg mb-4">Pay Rate Settings</h2>
        <div className="bg-white border rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 mb-2">Hourly Rate</p>
          <p className="text-2xl font-bold mb-3">
            {formatCurrency(currentUser.hourly_rate)}/hour
          </p>
          <p className="text-sm text-gray-600 mb-2">Base Commission Rate</p>
          <p className="text-2xl font-bold mb-3">
            {currentUser.commission_rate}%
          </p>

          {currentUser.payment_tiers &&
            currentUser.payment_tiers.length > 0 && (
              <>
                <p className="text-sm text-gray-600 mb-2 mt-4">Payment Tiers</p>
                <div className="space-y-2">
                  {currentUser.payment_tiers.map((tier, index) => {
                    const isActive =
                      payment && payment.activeTierIndex === index;
                    return (
                      <div
                        key={index}
                        className={`p-3 rounded border text-sm ${
                          isActive
                            ? "bg-yellow-100 border-yellow-500 border-2"
                            : "bg-gray-50"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <p className="font-semibold text-gray-700">
                            Tier {index + 1}
                          </p>
                          {isActive && (
                            <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded font-bold">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600">
                          Sales: {formatCurrency(tier.minSales || 0)} -{" "}
                          {tier.maxSales
                            ? formatCurrency(tier.maxSales)
                            : "Unlimited"}
                        </p>
                        <p className="text-gray-600">
                          {tier.type === "hourly_only"
                            ? "Base hourly pay only"
                            : `Base + ${tier.commission_rate}% commission`}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
        </div>
      </div>
    );
  };

  // My Shifts (Employee View)
  const MyShifts = () => {
    const myShifts = shifts
      .filter((s) => s.employeeId === currentUser.id && !s.active)
      .sort((a, b) => new Date(b.check_in_time) - new Date(a.check_in_time));

    return (
      <div className="p-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">My Shift History</h1>
        <div className="space-y-4">
          {myShifts.map((shift) => {
            const payment = calculateShiftPayment(shift, currentUser);
            return (
              <div key={shift.id} className="bg-white border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold">
                      {formatDate(shift.checkInTime)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatTime(shift.checkInTime)} -{" "}
                      {formatTime(shift.checkOutTime)} •{" "}
                      {formatDuration(shift.checkInTime, shift.checkOutTime)}
                    </p>
                  </div>
                  <p className="font-bold text-teal-600 text-xl">
                    {formatCurrency(payment.total)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Base Pay:</span>{" "}
                    <span className="font-semibold">
                      {formatCurrency(payment.hourlyPay)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Commission:</span>{" "}
                    <span className="font-semibold">
                      {formatCurrency(payment.commission)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Manage Employees (Admin Only)
  const ManageEmployees = () => {
    const [newEmployeeName, setNewEmployeeName] = useState("");
    const [showAddEmployee, setShowAddEmployee] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [hourlyRate, setHourlyRate] = useState("");
    const [commissionRate, setCommissionRate] = useState("");
    const [paymentTiers, setPaymentTiers] = useState([]);

    const handleAddEmployee = async () => {
      if (newEmployeeName.trim()) {
        await addEmployee(newEmployeeName.trim());
        setNewEmployeeName("");
        setShowAddEmployee(false);
      }
    };

    const handleDeleteEmployee = async (employeeId) => {
      if (employeeId) {
        await deleteEmployee(employeeId);
      }
    };

    const handleSaveRates = async () => {
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, {
          hourly_rate: parseFloat(hourlyRate) || 0,
          commission_rate: parseFloat(commissionRate) || 0,
          payment_tiers: paymentTiers,
        });
        setEditingEmployee(null);
        setHourlyRate("");
        setCommissionRate("");
        setPaymentTiers([]);
      }
    };

    const startEdit = (emp) => {
      setEditingEmployee(emp);
      setHourlyRate(emp.hourly_rate.toString());
      setCommissionRate(emp.commission_rate.toString());
      setPaymentTiers(
        emp.payment_tiers || [
          { minSales: 0, maxSales: null, type: "hourly_only" },
        ]
      );
    };

    const addTier = () => {
      setPaymentTiers([
        ...paymentTiers,
        {
          minSales: 0,
          maxSales: null,
          type: "hourly_only",
          commission_rate: 0,
        },
      ]);
    };

    const updateTier = (index, field, value) => {
      const updated = paymentTiers.map((tier, i) => {
        if (i === index) {
          return {
            ...tier,
            [field]:
              value === ""
                ? null
                : field === "type"
                ? value
                : parseFloat(value),
          };
        }
        return tier;
      });
      setPaymentTiers(updated);
    };

    const removeTier = (index) => {
      setPaymentTiers(paymentTiers.filter((_, i) => i !== index));
    };

    return (
      <div className="p-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Manage Employees</h1>

        <div className="space-y-3 mb-6">
          {employees.map((emp) => (
            <div key={emp.id} className="bg-white rounded-lg p-4 border">
              {editingEmployee?.id === emp.id ? (
                <div className="space-y-3">
                  <p className="font-semibold text-lg">{emp.name}</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Base Hourly Rate ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(e.target.value)}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Default Commission (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(e.target.value)}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-sm font-semibold text-gray-700">
                        Payment Tiers
                      </label>
                      <button
                        onClick={addTier}
                        className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                      >
                        + Add Tier
                      </button>
                    </div>

                    <div className="space-y-3">
                      {paymentTiers.map((tier, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 p-3 rounded border"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-semibold text-gray-700">
                              Tier {index + 1}
                            </span>
                            {paymentTiers.length > 1 && (
                              <button
                                onClick={() => removeTier(index)}
                                className="text-red-600 hover:text-red-700 text-sm"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">
                                Min Sales ($)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={tier.minSales || 0}
                                onChange={(e) =>
                                  updateTier(index, "minSales", e.target.value)
                                }
                                className="w-full p-2 border rounded text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">
                                Max Sales ($) - leave empty for unlimited
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={tier.maxSales || ""}
                                onChange={(e) =>
                                  updateTier(index, "maxSales", e.target.value)
                                }
                                placeholder="Unlimited"
                                className="w-full p-2 border rounded text-sm"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">
                                Payment Type
                              </label>
                              <select
                                value={tier.type}
                                onChange={(e) =>
                                  updateTier(index, "type", e.target.value)
                                }
                                className="w-full p-2 border rounded text-sm"
                              >
                                <option value="hourly_only">Hourly Only</option>
                                <option value="hourly_plus_commission">
                                  Hourly + Commission
                                </option>
                              </select>
                            </div>
                            {tier.type === "hourly_plus_commission" && (
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">
                                  Commission Rate (%)
                                </label>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={tier.commission_rate || 0}
                                  onChange={(e) =>
                                    updateTier(
                                      index,
                                      "commission_rate",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-2 border rounded text-sm"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveRates}
                      className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingEmployee(null)}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-start m-2">
                    <div>
                      <p className="font-semibold">{emp.name}</p>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(emp.hourly_rate)}/hr •{" "}
                        {emp.commission_rate}% base commission
                      </p>
                      {emp.payment_tiers && emp.payment_tiers.length > 1 && (
                        <p className="text-xs text-blue-600 mt-1">
                          {emp.payment_tiers.length} payment tiers configured
                        </p>
                      )}
                    </div>
                    <div className="flex justify-between m-2">
                      <button
                        onClick={() => startEdit(emp)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(emp.id)}
                        className="text-red-600 hover:text-red-700 m-2"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded mt-2">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-5 h-5" />
                      <span className="font-mono text-sm">{emp.qr_code}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {showAddEmployee ? (
          <div className="bg-gray-50 p-4 rounded-lg">
            <input
              type="text"
              value={newEmployeeName}
              onChange={(e) => setNewEmployeeName(e.target.value)}
              placeholder="Employee name"
              className="w-full p-3 border rounded mb-3"
              onKeyPress={(e) => e.key === "Enter" && handleAddEmployee()}
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddEmployee}
                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddEmployee(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddEmployee(true)}
            className="w-full bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add New Employee
          </button>
        )}
      </div>
    );
  };

  // Inventory Form
  const InventoryForm = ({ item, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      name: item?.name || "",
      price: item?.price || "",
      quantity: item?.quantity || "",
      variation: item?.variation || "",
      description: item?.description || "",
      category: item?.category || "",
      image: item?.image || "",
    });
    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (e) => {
      const file = e.target.files[0];
      if (file) {
        setUploading(true);
        try {
          const base64 = await fileToBase64(file);
          setFormData({ ...formData, image: base64 });
        } catch (error) {
          console.error("Error uploading image:", error);
        }
        setUploading(false);
      }
    };

    const handleSubmit = async () => {
      if (
        formData.name &&
        formData.price &&
        formData.quantity &&
        formData.category
      ) {
        await onSave({
          name: formData.name,
          price: parseFloat(formData.price),
          quantity: parseInt(formData.quantity),
          variation: formData.variation,
          description: formData.description,
          category: formData.category,
          image: formData.image,
        });
      }
    };

    return (
      <div className="p-4 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">
          {item ? "Edit Item" : "Add New Item"}
        </h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Item Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full p-3 border rounded-lg"
              placeholder="e.g., Vintage Band Tee"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full p-3 border rounded-lg"
            >
              <option value="">Select category...</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Price (₪) *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              className="w-full p-3 border rounded-lg"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">
              Quantity *
            </label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: e.target.value })
              }
              className="w-full p-3 border rounded-lg"
              placeholder="1"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">
              Variation (Optional)
            </label>
            <input
              type="text"
              value={formData.variation}
              onChange={(e) =>
                setFormData({ ...formData, variation: e.target.value })
              }
              className="w-full p-3 border rounded-lg"
              placeholder="e.g., Size M, Blue"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full p-3 border rounded-lg"
              rows="3"
              placeholder="Additional details about the item..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">
              Item Image
            </label>
            {formData.image && (
              <div className="mb-3">
                <img
                  src={formData.image}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded border"
                />
              </div>
            )}
            <label className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
              <Upload className="w-5 h-5" />
              <span>{uploading ? "Uploading..." : "Upload Image"}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSubmit}
              disabled={
                !formData.name ||
                !formData.price ||
                !formData.quantity ||
                !formData.category
              }
              className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {item ? "Update Item" : "Add Item"}
            </button>
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Sales Entry
  const SalesEntry = () => {
    const [selectedItems, setSelectedItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [proofOfPurchase1, setProofOfPurchase1] = useState("");
    const [proofOfPurchase2, setProofOfPurchase2] = useState("");
    const [itemPhoto, setItemPhoto] = useState("");
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(
      currentUser?.role === "employee" ? currentUser.id : ""
    );
    const [showQuickAdd, setShowQuickAdd] = useState(false);

    const activeEmployees = employees.filter((emp) => getActiveShift(emp.id));
    const availableInventory = inventory.filter((item) => item.quantity > 0);
    const filteredInventory = availableInventory.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.variation &&
          item.variation.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const togglePaymentMethod = (method) => {
      if (paymentMethods.includes(method)) {
        setPaymentMethods(paymentMethods.filter((m) => m !== method));
      } else {
        setPaymentMethods([...paymentMethods, method]);
      }
    };

    const addItemToSale = (item) => {
      const existing = selectedItems.find((si) => si.id === item.id);
      if (existing) {
        if (existing.quantity < item.quantity) {
          setSelectedItems(
            selectedItems.map((si) =>
              si.id === item.id ? { ...si, quantity: si.quantity + 1 } : si
            )
          );
        }
      } else {
        setSelectedItems([
          ...selectedItems,
          { ...item, quantity: 1, existingItemId: item.id },
        ]);
      }
    };

    const addNewItemToSale = (itemData) => {
      setSelectedItems([
        ...selectedItems,
        { ...itemData, id: `temp-${Date.now()}`, quantity: 1 },
      ]);
      setShowQuickAdd(false);
    };

    const updateQuantity = (itemId, newQuantity) => {
      const item = selectedItems.find((i) => i.id === itemId);
      if (item.isNewItem) {
        setSelectedItems(
          selectedItems.map((si) =>
            si.id === itemId
              ? { ...si, quantity: Math.max(1, newQuantity) }
              : si
          )
        );
      } else {
        const invItem = inventory.find((i) => i.id === item.existingItemId);
        const validQuantity = Math.min(
          Math.max(1, newQuantity),
          invItem.quantity
        );
        setSelectedItems(
          selectedItems.map((si) =>
            si.id === itemId ? { ...si, quantity: validQuantity } : si
          )
        );
      }
    };

    const removeItem = (itemId) =>
      setSelectedItems(selectedItems.filter((si) => si.id !== itemId));

    const handleImageUpload = async (e, setter) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const base64 = await fileToBase64(file);
          setter(base64);
        } catch (error) {
          console.error("Error uploading image:", error);
        }
      }
    };

    const total = selectedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const handleCompleteSale = async () => {
      if (
        selectedItems.length > 0 &&
        proofOfPurchase1 &&
        itemPhoto &&
        paymentMethods.length > 0 &&
        selectedEmployee
      ) {
        for (const item of selectedItems) {
          if (item.isNewItem) {
            await addInventoryItem({
              name: item.name,
              price: item.price,
              quantity: 0,
              variation: item.variation,
              description: item.description,
              category: item.category,
              image: item.image,
            });
          }
        }

        await addSale({
          items: selectedItems.map((item) => ({
            id: item.id,
            name: item.name,
            variation: item.variation,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
            existingItemId: item.existingItemId,
          })),
          total,
          proof_of_purchase: [proofOfPurchase1, proofOfPurchase2].filter(
            Boolean
          ),
          item_photo: itemPhoto,
          payment_methods: paymentMethods,
          employee_id: selectedEmployee,
        });

        setSelectedItems([]);
        setSearchQuery("");
        setProofOfPurchase1("");
        setProofOfPurchase2("");
        setItemPhoto("");
        setPaymentMethods([]);
        setSelectedEmployee(
          currentUser?.role === "employee" ? currentUser.id : ""
        );
        setCurrentScreen("dashboard");
      }
    };

    const QuickAddForm = ({ onSave, onCancel }) => {
      const [formData, setFormData] = useState({
        name: "",
        price: "",
        variation: "",
        description: "",
        category: "",
        image: "",
      });

      const handleSubmit = () => {
        if (formData.name && formData.price && formData.category) {
          onSave({
            ...formData,
            price: parseFloat(formData.price),
            isNewItem: true,
          });
        }
      };

      return (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Quick Add New Item
          </h3>
          <div className="space-y-2">
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full p-2 border rounded"
              placeholder="Item name *"
            />
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full p-2 border rounded"
            >
              <option value="">Select category *</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              className="w-full p-2 border rounded"
              placeholder="Price (₪) *"
            />
            <input
              type="text"
              value={formData.variation}
              onChange={(e) =>
                setFormData({ ...formData, variation: e.target.value })
              }
              className="w-full p-2 border rounded"
              placeholder="Variation (optional)"
            />
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full p-2 border rounded"
              rows="2"
              placeholder="Description (optional)"
            />
            {formData.image && (
              <img
                src={formData.image}
                alt="Preview"
                className="w-20 h-20 object-cover rounded border"
              />
            )}
            <label className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed rounded cursor-pointer hover:bg-blue-100">
              <Upload className="w-4 h-4" />
              <span className="text-sm">Add Item Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const base64 = await fileToBase64(file);
                    setFormData({ ...formData, image: base64 });
                  }
                }}
                className="hidden"
              />
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={
                  !formData.name || !formData.price || !formData.category
                }
                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-300"
              >
                Add to Sale
              </button>
              <button
                onClick={onCancel}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="p-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Record Sale</h1>

        <div className="mb-4 space-y-3">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Select Employee *
            </label>
            {currentUser?.role === "admin" ? (
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full p-3 border rounded-lg"
              >
                <option value="">Choose who made this sale...</option>
                {activeEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full p-3 border rounded-lg bg-gray-100">
                <p className="font-semibold">{currentUser.name}</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Payment Method(s) *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method}
                  onClick={() => togglePaymentMethod(method)}
                  className={`p-3 rounded-lg border-2 font-semibold capitalize transition-all ${
                    paymentMethods.includes(method)
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                  }`}
                >
                  {method === "bank_transfer" ? "Bank Transfer" : method}
                </button>
              ))}
            </div>
            {paymentMethods.length > 1 && (
              <p className="text-sm text-blue-600 mt-2">
                Mixed payment:{" "}
                {paymentMethods
                  .map((m) => (m === "bank_transfer" ? "Bank Transfer" : m))
                  .join(" + ")}
              </p>
            )}
          </div>
        </div>

        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search existing items..."
              className="w-full pl-10 pr-4 py-3 border rounded-lg"
            />
          </div>
          <button
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Item
          </button>
        </div>

        {showQuickAdd && (
          <QuickAddForm
            onSave={addNewItemToSale}
            onCancel={() => setShowQuickAdd(false)}
          />
        )}

        {searchQuery && !showQuickAdd && (
          <div className="mb-6 max-h-60 overflow-y-auto border rounded-lg">
            {filteredInventory.map((item) => (
              <button
                key={item.id}
                onClick={() => addItemToSale(item)}
                className="w-full p-3 hover:bg-gray-50 flex justify-between items-center border-b last:border-b-0"
              >
                <div className="text-left flex items-center gap-3">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    {item.variation && (
                      <p className="text-sm text-gray-600">{item.variation}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(item.price)}</p>
                  <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                </div>
              </button>
            ))}
            {filteredInventory.length === 0 && (
              <p className="p-4 text-center text-gray-500">No items found</p>
            )}
          </div>
        )}

        {selectedItems.length > 0 && (
          <>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-3">Selected Items</h3>
              <div className="space-y-3">
                {selectedItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold">
                        {item.name}
                        {item.isNewItem && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            NEW
                          </span>
                        )}
                      </p>
                      {item.variation && (
                        <p className="text-sm text-gray-600">
                          {item.variation}
                        </p>
                      )}
                    </div>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(item.id, parseInt(e.target.value) || 1)
                      }
                      className="w-16 p-2 border rounded text-center"
                    />
                    <p className="font-bold w-20 text-right">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t mt-4 pt-4 flex justify-between items-center">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-2xl font-bold">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white border-2 border-dashed rounded-lg p-4">
                <label className="block text-sm font-semibold mb-2">
                  Proof 1 *
                </label>
                {proofOfPurchase1 && (
                  <div className="mb-3">
                    <img
                      src={proofOfPurchase1}
                      alt="Proof 1"
                      className="w-full max-h-32 object-contain rounded border"
                    />
                  </div>
                )}
                <label className="flex items-center justify-center gap-2 w-full p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <Camera className="w-5 h-5" />
                  <span className="text-sm">
                    {proofOfPurchase1 ? "Change" : "Add Photo"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, setProofOfPurchase1)}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="bg-white border-2 border-dashed rounded-lg p-4">
                <label className="block text-sm font-semibold mb-2">
                  Proof 2 (Optional)
                </label>
                {proofOfPurchase2 && (
                  <div className="mb-3">
                    <img
                      src={proofOfPurchase2}
                      alt="Proof 2"
                      className="w-full max-h-32 object-contain rounded border"
                    />
                  </div>
                )}
                <label className="flex items-center justify-center gap-2 w-full p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <Camera className="w-5 h-5" />
                  <span className="text-sm">
                    {proofOfPurchase2 ? "Change" : "Add Photo"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, setProofOfPurchase2)}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="bg-white border-2 border-dashed rounded-lg p-4">
                <label className="block text-sm font-semibold mb-2">
                  Item Photo *
                </label>
                {itemPhoto && (
                  <div className="mb-3">
                    <img
                      src={itemPhoto}
                      alt="Item"
                      className="w-full max-h-32 object-contain rounded border"
                    />
                  </div>
                )}
                <label className="flex items-center justify-center gap-2 w-full p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <Camera className="w-5 h-5" />
                  <span className="text-sm">
                    {itemPhoto ? "Change" : "Add Photo"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, setItemPhoto)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <button
              onClick={handleCompleteSale}
              disabled={
                !proofOfPurchase1 ||
                !itemPhoto ||
                paymentMethods.length === 0 ||
                !selectedEmployee
              }
              className="w-full bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Complete Sale
            </button>
            {(!proofOfPurchase1 ||
              !itemPhoto ||
              paymentMethods.length === 0 ||
              !selectedEmployee) && (
              <p className="text-center text-sm text-red-600 mt-2">
                Please complete all required fields
              </p>
            )}
          </>
        )}
      </div>
    );
  };

  // Sales Log with sorting and total
  const SalesLog = () => {
    const [sortBy, setSortBy] = useState("date");
    const [sortOrder, setSortOrder] = useState("desc");
    const [filterPayment, setFilterPayment] = useState("all");

    let filteredSales = [...sales];

    // Filter by payment method
    if (filterPayment !== "all") {
      filteredSales = filteredSales.filter(
        (sale) =>
          sale.payment_methods && sale.payment_methods.includes(filterPayment)
      );
    }

    // Sort
    filteredSales.sort((a, b) => {
      const multiplier = sortOrder === "asc" ? 1 : -1;
      if (sortBy === "date")
        return multiplier * (new Date(b.timestamp) - new Date(a.timestamp));
      if (sortBy === "amount") return multiplier * (b.total - a.total);
      return 0;
    });

    const totalRevenue = filteredSales.reduce(
      (sum, sale) => sum + sale.total,
      0
    );
    const totalSales = filteredSales.length;

    return (
      <div className="p-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Sales Log</h1>

        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-800">{totalSales}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="p-2 border rounded-lg"
          >
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="p-2 border rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            {sortOrder === "asc" ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
            <span>{sortOrder === "asc" ? "Ascending" : "Descending"}</span>
          </button>
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="p-2 border rounded-lg"
          >
            <option value="all">All Payments</option>
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method === "bank_transfer"
                  ? "Bank Transfer"
                  : method.charAt(0).toUpperCase() + method.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          {filteredSales.map((sale) => {
            const employee = employees.find((e) => e.id === sale.employeeId);
            const paymentDisplay = sale.payment_methods
              ? sale.payment_methods
                  .map((m) => (m === "bank_transfer" ? "Bank Transfer" : m))
                  .join(" + ")
              : sale.paymentType || "N/A";
            return (
              <div key={sale.id} className="bg-white border rounded-lg p-4">
                <div className="flex gap-4 mb-3">
                  {sale.item_photo && (
                    <img
                      src={sale.item_photo}
                      alt="Sale items"
                      className="w-32 h-32 object-cover rounded border"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm text-gray-600">
                          {formatDate(sale.timestamp)} at{" "}
                          {formatTime(sale.timestamp)}
                        </p>
                        {employee && (
                          <p className="text-sm font-semibold text-blue-600">
                            Sold by: {employee.name}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 capitalize">
                          <span className="font-semibold">Payment:</span>{" "}
                          {paymentDisplay}
                        </p>
                      </div>
                      <p className="text-xl font-bold">
                        {formatCurrency(sale.total)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      {sale.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>
                            {item.name}
                            {item.variation && ` - ${item.variation}`}
                            {item.quantity > 1 && ` x${item.quantity}`}
                          </span>
                          <span>
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {sale.proof_of_purchase &&
                  sale.proof_of_purchase.length > 0 && (
                    <div className="pt-3 border-t">
                      <p className="text-xs font-semibold text-gray-600 mb-2">
                        Proof of Purchase
                      </p>
                      <div className="flex gap-2">
                        {sale.proof_of_purchase.map((proof, idx) => (
                          <img
                            key={idx}
                            src={proof}
                            alt={`Proof ${idx + 1}`}
                            className="w-32 h-32 object-contain rounded border bg-gray-50"
                          />
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            );
          })}
          {filteredSales.length === 0 && (
            <p className="text-center text-gray-500 py-8">No sales found</p>
          )}
        </div>
      </div>
    );
  };

  // All Payments (Admin)
  const AllPayments = () => {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Employee Payments</h1>
        <div className="space-y-4">
          {employees.map((emp) => {
            const empShifts = shifts
              .filter((s) => s.employeeId === emp.id && !s.active)
              .sort(
                (a, b) => new Date(b.check_in_time) - new Date(a.check_in_time)
              )
              .slice(0, 5);
            if (empShifts.length === 0) return null;

            return (
              <div key={emp.id} className="bg-white border rounded-lg p-4">
                <h3 className="font-bold mb-3">{emp.name}</h3>
                <div className="space-y-3">
                  {empShifts.map((shift) => {
                    const payment = calculateShiftPayment(shift, emp);
                    return (
                      <div
                        key={shift.id}
                        className="border-l-4 border-teal-500 pl-3 py-2 bg-gray-50 rounded"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-sm font-semibold">
                              {formatDate(shift.check_in_time)}
                            </p>
                            <p className="text-xs text-gray-600">
                              {formatTime(shift.check_in_time)} -{" "}
                              {formatTime(shift.check_out_time)} •{" "}
                              {payment.hoursWorked.toFixed(2)} hours
                            </p>
                          </div>
                          <p className="font-bold text-teal-600">
                            {formatCurrency(payment.total)}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Hourly Pay:</span>{" "}
                            <span className="font-semibold">
                              {formatCurrency(payment.hourlyPay)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Commission:</span>{" "}
                            <span className="font-semibold">
                              {formatCurrency(payment.commission)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Shift Log (Admin)
  const ShiftLog = () => {
    const completedShifts = shifts.filter((s) => !s.active);
    const shiftsByDate = completedShifts.reduce((acc, shift) => {
      const date = new Date(shift.check_in_time).toDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(shift);
      return acc;
    }, {});
    const sortedDates = Object.keys(shiftsByDate).sort(
      (a, b) => new Date(b) - new Date(a)
    );

    return (
      <div className="p-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Shift History</h1>
        <div className="space-y-6">
          {sortedDates.map((date) => {
            const dayShifts = shiftsByDate[date].sort(
              (a, b) => new Date(b.check_in_time) - new Date(a.check_in_time)
            );
            const totalHours = dayShifts.reduce(
              (sum, shift) =>
                sum +
                calculateHoursWorked(shift.check_in_time, shift.check_out_time),
              0
            );

            return (
              <div key={date} className="bg-white border rounded-lg p-4">
                <div className="flex justify-between items-center mb-4 pb-3 border-b">
                  <h3 className="font-bold text-lg">{formatDate(date)}</h3>
                  <span className="text-sm text-gray-600">
                    Total: {totalHours.toFixed(1)} hours
                  </span>
                </div>
                <div className="space-y-3">
                  {dayShifts.map((shift) => {
                    const employee = employees.find(
                      (e) => e.id === shift.employeeId
                    );
                    return (
                      <div
                        key={shift.id}
                        className="flex justify-between items-center py-2"
                      >
                        <div>
                          <p className="font-semibold">
                            {employee?.name || "Unknown"}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatTime(shift.check_in_time)} -{" "}
                            {formatTime(shift.check_out_time)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-blue-600">
                            {formatDuration(
                              shift.check_in_time,
                              shift.check_out_time
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {sortedDates.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              No completed shifts yet
            </p>
          )}
        </div>
      </div>
    );
  };

  // Payment Info Component
  const PaymentInfo = () => {
    const isAdmin = currentUser?.role === "admin";
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState(paymentInfo);

    const handleSave = async () => {
      await updatePaymentInfo(formData);
      setEditing(false);
    };

    const handleCancel = () => {
      setFormData(paymentInfo);
      setEditing(false);
    };

    return (
      <div className="p-4 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Payment Transfer Information</h1>
          {isAdmin && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Edit
            </button>
          )}
        </div>

        <div className="space-y-6">
          {/* Bit Section */}
          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold">Bit</h2>
            </div>

            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Account Holder's Name
                  </label>
                  <input
                    type="text"
                    value={formData.bit.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bit: { ...formData.bit, name: e.target.value },
                      })
                    }
                    className="w-full p-3 border rounded-lg"
                    placeholder="Enter name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.bit.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bit: { ...formData.bit, phone: e.target.value },
                      })
                    }
                    className="w-full p-3 border rounded-lg"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Account Holder</span>
                  <span className="font-semibold">
                    {paymentInfo.bit.name || "Not set"}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Phone Number</span>
                  <span className="font-semibold">
                    {paymentInfo.bit.phone || "Not set"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Paybox Section */}
          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-xl font-bold">Paybox</h2>
            </div>

            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Account Holder's Name
                  </label>
                  <input
                    type="text"
                    value={formData.paybox.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paybox: { ...formData.paybox, name: e.target.value },
                      })
                    }
                    className="w-full p-3 border rounded-lg"
                    placeholder="Enter name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.paybox.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paybox: { ...formData.paybox, phone: e.target.value },
                      })
                    }
                    className="w-full p-3 border rounded-lg"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Account Holder</span>
                  <span className="font-semibold">
                    {paymentInfo.paybox.name || "Not set"}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Phone Number</span>
                  <span className="font-semibold">
                    {paymentInfo.paybox.phone || "Not set"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Bank Transfer Section */}
          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold">Bank Transfer</h2>
            </div>

            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Account Holder's Name
                  </label>
                  <input
                    type="text"
                    value={formData.bank_transfer.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bank_transfer: {
                          ...formData.bank_transfer,
                          name: e.target.value,
                        },
                      })
                    }
                    className="w-full p-3 border rounded-lg"
                    placeholder="Enter name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={formData.bank_transfer.bankName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bank_transfer: {
                          ...formData.bank_transfer,
                          bankName: e.target.value,
                        },
                      })
                    }
                    className="w-full p-3 border rounded-lg"
                    placeholder="Enter bank name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Bank Number
                    </label>
                    <input
                      type="text"
                      value={formData.bank_transfer.bankNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bank_transfer: {
                            ...formData.bank_transfer,
                            bankNumber: e.target.value,
                          },
                        })
                      }
                      className="w-full p-3 border rounded-lg"
                      placeholder="e.g., 12"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Branch Number
                    </label>
                    <input
                      type="text"
                      value={formData.bank_transfer.branchNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bank_transfer: {
                            ...formData.bank_transfer,
                            branchNumber: e.target.value,
                          },
                        })
                      }
                      className="w-full p-3 border rounded-lg"
                      placeholder="e.g., 456"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={formData.bank_transfer.accountNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bank_transfer: {
                          ...formData.bank_transfer,
                          accountNumber: e.target.value,
                        },
                      })
                    }
                    className="w-full p-3 border rounded-lg"
                    placeholder="Enter account number"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Account Holder</span>
                  <span className="font-semibold">
                    {paymentInfo.bank_transfer.name || "Not set"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Bank Name</span>
                  <span className="font-semibold">
                    {paymentInfo.bank_transfer.bankName || "Not set"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Bank Number</span>
                  <span className="font-semibold">
                    {paymentInfo.bank_transfer.bankNumber || "Not set"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Branch Number</span>
                  <span className="font-semibold">
                    {paymentInfo.bank_transfer.branchNumber || "Not set"}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Account Number</span>
                  <span className="font-semibold">
                    {paymentInfo.bank_transfer.accountNumber || "Not set"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {editing && (
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSave}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700"
            >
              Save Changes
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  };

  // Main render
  if (!currentUser) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <NavigationMenu />
      {currentScreen === "dashboard" && <Dashboard />}
      {currentScreen === "checkin" && <CheckInOut />}
      {currentScreen === "inventory" && <InventoryList />}
      {currentScreen === "audit" && <InventoryAudit />}
      {currentScreen === "additem" && (
        <InventoryForm
          onSave={async (item) => {
            await addInventoryItem(item);
            setCurrentScreen("inventory");
          }}
          onCancel={() => setCurrentScreen("inventory")}
        />
      )}
      {currentScreen === "sales" && <SalesEntry />}
      {currentScreen === "saleslog" && <SalesLog />}
      {currentScreen === "paymentinfo" && <PaymentInfo />}
      {currentScreen === "mypayments" && <MyPayments />}
      {currentScreen === "myshifts" && <MyShifts />}
      {currentScreen === "payments" && <AllPayments />}
      {currentScreen === "shiftlog" && <ShiftLog />}
      {currentScreen === "manageemployees" && <ManageEmployees />}
    </div>
  );
}

export default App;
