import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  PieChart,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  SlidersHorizontal,
  Utensils,
  Car,
  Home,
  Zap,
  Briefcase,
  X,
  Trash2,
  WalletCards,
} from "lucide-react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useEffect, useMemo, useState } from "react";
import "./index.css";
import Auth from "./Auth";

const API_URL = "http://localhost:5000/api/expenses";

const toDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatMoney = (value) =>
  `PKR ${new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 0,
  }).format(value || 0)}`;

const createMonthlyData = (transactions) => {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const monthly = months.map((month, index) => ({
    month,
    income: 0,
    expense: 0,
    monthIndex: index,
  }));

  transactions.forEach((transaction) => {
    const date = new Date(transaction.date);
    const monthIndex = date.getMonth();

    if (transaction.type === "income") {
      monthly[monthIndex].income += Number(transaction.amount);
    } else {
      monthly[monthIndex].expense += Number(transaction.amount);
    }
  });

  return monthly;
};

const categoryIcons = {
  Food: Utensils,
  Transport: Car,
  Shopping: ShoppingBag,
  Bills: Zap,
  Housing: Home,
  Salary: Briefcase,
  Other: CircleDollarSign,
};

const categories = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Housing",
  "Salary",
  "Other",
];

const getCalendarDays = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const previousMonthDays = new Date(year, month, 0).getDate();

  const days = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({
      day: previousMonthDays - i,
      current: false,
      date: new Date(year, month - 1, previousMonthDays - i),
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    days.push({
      day,
      current: true,
      date: new Date(year, month, day),
    });
  }

  let nextDay = 1;

  while (days.length < 42) {
    days.push({
      day: nextDay,
      current: false,
      date: new Date(year, month + 1, nextDay),
    });

    nextDay++;
  }

  return days;
};

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("spendlyUser");

    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [activePage, setActivePage] = useState("dashboard");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [notifications, setNotifications] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "Food",
    type: "expense",
    date: toDateInputValue(new Date()),
    note: "",
  });

  const fetchTransactions = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("spendlyToken");
      const workspaceId = localStorage.getItem("spendlyWorkspaceId");

      if (!token || !workspaceId) {
        setTransactions([]);
        return;
      }

      const response = await fetch(
        `${API_URL}?workspaceId=${workspaceId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch transactions"
        );
      }

      setTransactions(data);
    } catch (error) {
      console.error("Fetch transactions error:", error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const addTransaction = async (e) => {
    e.preventDefault();

    if (!form.title.trim() || !form.amount) {
      return;
    }

    try {
      const token = localStorage.getItem("spendlyToken");
      const workspaceId = localStorage.getItem("spendlyWorkspaceId");

      if (!token) {
        alert("Please login again.");
        return;
      }

      if (!workspaceId) {
        alert("No workspace found. Please logout and login again.");
        return;
      }

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title,
          amount: Number(form.amount),
          category: form.category,
          type: form.type,
          date: form.date,
          note: form.note,
          workspaceId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to add transaction"
        );
      }

      setTransactions((prev) => [data, ...prev]);

      setForm({
        title: "",
        amount: "",
        category: "Food",
        type: "expense",
        date: toDateInputValue(new Date()),
        note: "",
      });

      setShowModal(false);
    } catch (error) {
      console.error("Add transaction error:", error);
      alert(error.message || "Could not add transaction.");
    }
  };

  const deleteTransaction = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this transaction?"
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("spendlyToken");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete transaction");
      }

      setTransactions((prev) =>
        prev.filter((transaction) => transaction._id !== id)
      );
    } catch (error) {
      console.error(error);
      alert("Could not delete transaction.");
    }
  };

  const totalIncome = useMemo(() => {
    return transactions
      .filter((transaction) => transaction.type === "income")
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  }, [transactions]);

  const totalExpense = useMemo(() => {
    return transactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  }, [transactions]);

  const balance = totalIncome - totalExpense;

  const spendingData = useMemo(
    () => createMonthlyData(transactions),
    [transactions]
  );

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesSearch =
        `${transaction.title} ${transaction.category} ${
          transaction.note || ""
        }`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const transactionDate = toDateInputValue(
        new Date(transaction.date)
      );

      const matchesDate =
        !selectedDate || transactionDate === selectedDate;

      const matchesType =
        selectedType === "all" || transaction.type === selectedType;

      const matchesCategory =
        selectedCategory === "all" ||
        transaction.category === selectedCategory;

      return (
        matchesSearch &&
        matchesDate &&
        matchesType &&
        matchesCategory
      );
    });
  }, [
    transactions,
    searchTerm,
    selectedDate,
    selectedType,
    selectedCategory,
  ]);

  const categoryTotals = useMemo(() => {
    const totals = {};

    transactions
      .filter((transaction) => transaction.type === "expense")
      .forEach((transaction) => {
        if (!totals[transaction.category]) {
          totals[transaction.category] = 0;
        }

        totals[transaction.category] += Number(transaction.amount);
      });

    return Object.entries(totals)
      .map(([category, amount]) => ({
        category,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const calendarDays = getCalendarDays(calendarDate);

  const selectedDayTransactions = selectedDate
    ? transactions.filter(
        (transaction) =>
          toDateInputValue(new Date(transaction.date)) === selectedDate
      )
    : [];

  const calendarMonthName = calendarDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const changeCalendarMonth = (amount) => {
    setCalendarDate(
      new Date(
        calendarDate.getFullYear(),
        calendarDate.getMonth() + amount,
        1
      )
    );
  };

  const goToToday = () => {
    const today = new Date();

    setCalendarDate(today);
    setSelectedDate(toDateInputValue(today));
  };

  const openPage = (page) => {
    setActivePage(page);
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("spendlyToken");
    localStorage.removeItem("spendlyUser");

    setUser(null);
    setTransactions([]);
  };

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "transactions",
      label: "Transactions",
      icon: WalletCards,
    },
    {
      id: "calendar",
      label: "Calendar",
      icon: CalendarDays,
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: PieChart,
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
    },
  ];

  const renderTransactionRow = (transaction) => {
    const Icon =
      categoryIcons[transaction.category] || CircleDollarSign;

    return (
      <div className="transaction-row" key={transaction._id}>
        <div className="transaction-main">
          <div className={`transaction-icon ${transaction.type}`}>
            <Icon size={18} />
          </div>

          <div>
            <h4>{transaction.title}</h4>

            <p>
              {transaction.category} • {formatDate(transaction.date)}
            </p>
          </div>
        </div>

        <div className="transaction-right">
          <strong className={transaction.type}>
            {transaction.type === "income" ? "+" : "-"}
            {formatMoney(transaction.amount)}
          </strong>

          <button
            className="delete-button"
            onClick={() => deleteTransaction(transaction._id)}
            title="Delete transaction"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    );
  };

  const Dashboard = () => (
    <div className="page-content">
      <div className="welcome-row">
        <div>
          <p className="eyebrow">PERSONAL FINANCE</p>

          <h1>Good to see you.</h1>

          <p className="page-subtitle">
            Keep track of where your money goes.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowModal(true)}
        >
          <Plus size={18} />
          Add transaction
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card main-stat">
          <div className="stat-top">
            <span>Total balance</span>

            <div className="stat-icon">
              <CircleDollarSign size={20} />
            </div>
          </div>

          <h2>{formatMoney(balance)}</h2>

          <div className="balance-line">
            <span>Available balance</span>

            <span className={balance >= 0 ? "positive" : "negative"}>
              {balance >= 0 ? "Healthy" : "Over budget"}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Total income</span>

            <div className="stat-icon income-icon">
              <ArrowDownLeft size={19} />
            </div>
          </div>

          <h2>{formatMoney(totalIncome)}</h2>

          <p className="stat-caption">Money coming in</p>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Total expenses</span>

            <div className="stat-icon expense-icon">
              <ArrowUpRight size={19} />
            </div>
          </div>

          <h2>{formatMoney(totalExpense)}</h2>

          <p className="stat-caption">Money going out</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="chart-card">
          <div className="card-heading">
            <div>
              <p className="eyebrow">CASH FLOW</p>
              <h3>Income & expenses</h3>
            </div>

            <button
              className="outline-button"
              onClick={() => openPage("analytics")}
            >
              View analytics
            </button>
          </div>

          <div className="chart-legend">
            <span>
              <i className="legend-dot income-dot"></i>
              Income
            </span>

            <span>
              <i className="legend-dot expense-dot"></i>
              Expenses
            </span>
          </div>

          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={spendingData}
                margin={{
                  top: 20,
                  right: 12,
                  left: -18,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient
                    id="incomeGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#6b8f71"
                      stopOpacity={0.22}
                    />

                    <stop
                      offset="100%"
                      stopColor="#6b8f71"
                      stopOpacity={0}
                    />
                  </linearGradient>

                  <linearGradient
                    id="expenseGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#b66a6a"
                      stopOpacity={0.15}
                    />

                    <stop
                      offset="100%"
                      stopColor="#b66a6a"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  vertical={false}
                  stroke="#ebe9e2"
                  strokeDasharray="3 5"
                />

                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#858983",
                    fontSize: 12,
                  }}
                  dy={10}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#858983",
                    fontSize: 11,
                  }}
                  tickFormatter={(value) =>
                    value >= 1000
                      ? `PKR ${(value / 1000).toFixed(1)}k`
                      : `PKR ${value}`
                  }
                />

                <Tooltip
                  contentStyle={{
                    border: "1px solid #e7e4dc",
                    borderRadius: "12px",
                    boxShadow:
                      "0 10px 30px rgba(31, 37, 34, 0.08)",
                    background: "#ffffff",
                  }}
                  formatter={(value) => [
                    formatMoney(value),
                    "",
                  ]}
                />

                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#6b8f71"
                  strokeWidth={3}
                  fill="url(#incomeGradient)"
                  dot={false}
                  activeDot={{
                    r: 5,
                    strokeWidth: 3,
                    fill: "#ffffff",
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#b66a6a"
                  strokeWidth={3}
                  fill="url(#expenseGradient)"
                  dot={false}
                  activeDot={{
                    r: 5,
                    strokeWidth: 3,
                    fill: "#ffffff",
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="side-card">
          <div className="card-heading">
            <div>
              <p className="eyebrow">SPENDING</p>
              <h3>Top categories</h3>
            </div>

            <button
              className="icon-button"
              onClick={() => openPage("analytics")}
            >
              <MoreHorizontal size={19} />
            </button>
          </div>

          {categoryTotals.length === 0 ? (
            <div className="empty-small">
              <CircleDollarSign size={28} />
              <p>No expenses yet</p>
            </div>
          ) : (
            <div className="category-list">
              {categoryTotals.slice(0, 5).map((item) => {
                const Icon =
                  categoryIcons[item.category] ||
                  CircleDollarSign;

                const percentage =
                  totalExpense > 0
                    ? Math.round(
                        (item.amount / totalExpense) * 100
                      )
                    : 0;

                return (
                  <div
                    className="category-item"
                    key={item.category}
                  >
                    <div className="category-icon">
                      <Icon size={17} />
                    </div>

                    <div className="category-info">
                      <div>
                        <strong>{item.category}</strong>
                        <span>{percentage}%</span>
                      </div>

                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="transactions-card">
        <div className="card-heading">
          <div>
            <p className="eyebrow">ACTIVITY</p>
            <h3>Recent transactions</h3>
          </div>

          <button
            className="outline-button"
            onClick={() => openPage("transactions")}
          >
            View all
          </button>
        </div>

        {loading ? (
          <div className="empty-state">
            <p>Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <CreditCard size={32} />

            <h4>No transactions yet</h4>

            <p>
              Add your first transaction to start tracking.
            </p>

            <button
              className="primary-button"
              onClick={() => setShowModal(true)}
            >
              <Plus size={17} />
              Add transaction
            </button>
          </div>
        ) : (
          <div className="transaction-list">
            {transactions.slice(0, 5).map(renderTransactionRow)}
          </div>
        )}
      </div>
    </div>
  );

  const TransactionsPage = () => (
    <div className="page-content">
      <div className="welcome-row">
        <div>
          <p className="eyebrow">MONEY ACTIVITY</p>

          <h1>Transactions</h1>

          <p className="page-subtitle">
            Search, filter and manage your transactions.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowModal(true)}
        >
          <Plus size={18} />
          Add transaction
        </button>
      </div>

      <div className="filter-card">
        <div className="search-box">
          <Search size={18} />

          <input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
        >
          <option value="all">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expenses</option>
        </select>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">All categories</option>

          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <div className="date-filter">
          <CalendarDays size={17} />

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <button
          className="clear-filter"
          onClick={() => {
            setSearchTerm("");
            setSelectedDate("");
            setSelectedType("all");
            setSelectedCategory("all");
          }}
        >
          <SlidersHorizontal size={16} />
          Reset
        </button>
      </div>

      <div className="transactions-card">
        <div className="card-heading">
          <div>
            <p className="eyebrow">RESULTS</p>

            <h3>
              {filteredTransactions.length} transactions
            </h3>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <Search size={30} />

            <h4>No matching transactions</h4>

            <p>Try changing your search or filters.</p>
          </div>
        ) : (
          <div className="transaction-list">
            {filteredTransactions.map(renderTransactionRow)}
          </div>
        )}
      </div>
    </div>
  );

  const CalendarPage = () => {
    const selectedIncome = selectedDayTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const selectedExpense = selectedDayTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return (
      <div className="page-content">
        <div className="welcome-row">
          <div>
            <p className="eyebrow">DATE VIEW</p>

            <h1>Calendar</h1>

            <p className="page-subtitle">
              Select a day to see your financial activity.
            </p>
          </div>

          <button
            className="outline-button"
            onClick={goToToday}
          >
            Today
          </button>
        </div>

        <div className="calendar-layout">
          <div className="calendar-card">
            <div className="calendar-header">
              <button
                className="calendar-nav"
                onClick={() => changeCalendarMonth(-1)}
              >
                <ChevronLeft size={19} />
              </button>

              <h2>{calendarMonthName}</h2>

              <button
                className="calendar-nav"
                onClick={() => changeCalendarMonth(1)}
              >
                <ChevronRight size={19} />
              </button>
            </div>

            <div className="weekdays">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            <div className="calendar-grid">
              {calendarDays.map((item, index) => {
                const dateValue = toDateInputValue(item.date);

                const hasTransactions = transactions.some(
                  (transaction) =>
                    toDateInputValue(
                      new Date(transaction.date)
                    ) === dateValue
                );

                const isSelected = selectedDate === dateValue;

                const isToday =
                  dateValue === toDateInputValue(new Date());

                return (
                  <button
                    key={index}
                    className={`calendar-day ${
                      !item.current ? "muted-day" : ""
                    } ${isSelected ? "selected-day" : ""} ${
                      isToday ? "today-day" : ""
                    }`}
                    onClick={() => {
                      setSelectedDate(dateValue);
                    }}
                  >
                    <span>{item.day}</span>

                    {hasTransactions && (
                      <i className="calendar-dot"></i>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="calendar-summary">
            <div className="summary-header">
              <div>
                <p className="eyebrow">SELECTED DAY</p>

                <h3>
                  {selectedDate
                    ? formatDate(selectedDate)
                    : "Choose a date"}
                </h3>
              </div>

              <CalendarDays size={22} />
            </div>

            {selectedDate ? (
              <>
                <div className="day-stats">
                  <div>
                    <span>Income</span>

                    <strong className="income">
                      +{formatMoney(selectedIncome)}
                    </strong>
                  </div>

                  <div>
                    <span>Expenses</span>

                    <strong className="expense">
                      -{formatMoney(selectedExpense)}
                    </strong>
                  </div>
                </div>

                <div className="selected-transactions">
                  {selectedDayTransactions.length === 0 ? (
                    <div className="empty-small">
                      <p>No transactions on this date.</p>
                    </div>
                  ) : (
                    selectedDayTransactions.map(
                      renderTransactionRow
                    )
                  )}
                </div>
              </>
            ) : (
              <div className="calendar-placeholder">
                <CalendarDays size={36} />

                <p>
                  Click any date to see transactions for that
                  day.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const AnalyticsPage = () => (
    <div className="page-content">
      <div className="welcome-row">
        <div>
          <p className="eyebrow">FINANCIAL INSIGHTS</p>

          <h1>Analytics</h1>

          <p className="page-subtitle">
            Understand your income and spending patterns.
          </p>
        </div>
      </div>

      <div className="stats-grid analytics-stats">
        <div className="stat-card">
          <div className="stat-top">
            <span>Average monthly expense</span>

            <div className="stat-icon expense-icon">
              <ArrowUpRight size={19} />
            </div>
          </div>

          <h2>
            {formatMoney(
              totalExpense /
                Math.max(
                  spendingData.filter(
                    (month) => month.expense > 0
                  ).length,
                  1
                )
            )}
          </h2>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Largest category</span>

            <div className="stat-icon">
              <PieChart size={19} />
            </div>
          </div>

          <h2 className="category-result">
            {categoryTotals[0]?.category || "—"}
          </h2>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Transactions</span>

            <div className="stat-icon">
              <CreditCard size={19} />
            </div>
          </div>

          <h2>{transactions.length}</h2>
        </div>
      </div>

      <div className="chart-card analytics-chart">
        <div className="card-heading">
          <div>
            <p className="eyebrow">YEAR OVERVIEW</p>

            <h3>Cash flow trend</h3>
          </div>
        </div>

        <div className="chart-wrapper large-chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={spendingData}
              margin={{
                top: 20,
                right: 15,
                left: -18,
                bottom: 0,
              }}
            >
              <CartesianGrid
                vertical={false}
                stroke="#ebe9e2"
                strokeDasharray="3 5"
              />

              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "#858983",
                  fontSize: 12,
                }}
                dy={10}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "#858983",
                  fontSize: 11,
                }}
                tickFormatter={(value) =>
                  value >= 1000
                    ? `PKR ${(value / 1000).toFixed(1)}k`
                    : `PKR ${value}`
                }
              />

              <Tooltip
                contentStyle={{
                  border: "1px solid #e7e4dc",
                  borderRadius: "12px",
                  background: "#ffffff",
                }}
                formatter={(value) => formatMoney(value)}
              />

              <Area
                type="monotone"
                dataKey="income"
                stroke="#6b8f71"
                strokeWidth={3}
                fill="none"
              />

              <Area
                type="monotone"
                dataKey="expense"
                stroke="#b66a6a"
                strokeWidth={3}
                fill="none"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="transactions-card">
        <div className="card-heading">
          <div>
            <p className="eyebrow">BREAKDOWN</p>

            <h3>Spending by category</h3>
          </div>
        </div>

        {categoryTotals.length === 0 ? (
          <div className="empty-state">
            <PieChart size={30} />

            <p>No expense data available yet.</p>
          </div>
        ) : (
          <div className="analytics-category-grid">
            {categoryTotals.map((item) => {
              const Icon =
                categoryIcons[item.category] ||
                CircleDollarSign;

              const percentage =
                totalExpense > 0
                  ? Math.round(
                      (item.amount / totalExpense) * 100
                    )
                  : 0;

              return (
                <div
                  className="analytics-category"
                  key={item.category}
                >
                  <div className="analytics-category-icon">
                    <Icon size={18} />
                  </div>

                  <div>
                    <strong>{item.category}</strong>

                    <p>{formatMoney(item.amount)}</p>
                  </div>

                  <span>{percentage}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const SettingsPage = () => (
    <div className="page-content">
      <div className="welcome-row">
        <div>
          <p className="eyebrow">PREFERENCES</p>

          <h1>Settings</h1>

          <p className="page-subtitle">
            Manage your Spendly preferences.
          </p>
        </div>
      </div>

      <div className="settings-card">
        <div className="settings-section">
          <div className="settings-title">
            <div className="settings-icon">
              <Bell size={19} />
            </div>

            <div>
              <h3>Notifications</h3>

              <p>
                Show reminders and updates inside the dashboard.
              </p>
            </div>
          </div>

          <button
            className={`toggle ${
              notifications ? "active" : ""
            }`}
            onClick={() =>
              setNotifications(!notifications)
            }
          >
            <span></span>
          </button>
        </div>

        <div className="settings-section">
          <div className="settings-title">
            <div className="settings-icon">
              <CircleDollarSign size={19} />
            </div>

            <div>
              <h3>Currency</h3>

              <p>
                Your dashboard currently uses Pakistani Rupees.
              </p>
            </div>
          </div>

          <span className="setting-value">PKR</span>
        </div>

        <div className="settings-section">
          <div className="settings-title">
            <div className="settings-icon">
              <SlidersHorizontal size={19} />
            </div>

            <div>
              <h3>Reset filters</h3>

              <p>
                Clear search, date and category filters.
              </p>
            </div>
          </div>

          <button
            className="outline-button"
            onClick={() => {
              setSearchTerm("");
              setSelectedDate("");
              setSelectedType("all");
              setSelectedCategory("all");
            }}
          >
            Reset
          </button>
        </div>

        <div className="settings-section">
          <div className="settings-title">
            <div className="settings-icon">
              <X size={19} />
            </div>

            <div>
              <h3>Account</h3>

              <p>
                Sign out of your Spendly account.
              </p>
            </div>
          </div>

          <button
            className="outline-button"
            onClick={handleLogout}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );

  const renderPage = () => {
    if (activePage === "transactions") {
      return <TransactionsPage />;
    }

    if (activePage === "calendar") {
      return <CalendarPage />;
    }

    if (activePage === "analytics") {
      return <AnalyticsPage />;
    }

    if (activePage === "settings") {
      return <SettingsPage />;
    }

    return <Dashboard />;
  };

  if (!user) {
    return (
      <Auth
        onLogin={(loggedInUser) => {
          setUser(loggedInUser);
        }}
      />
    );
  }

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`sidebar ${
          sidebarOpen ? "sidebar-open" : ""
        }`}
      >
        <div className="brand">
          <div className="brand-mark">
            <CircleDollarSign size={21} />
          </div>

          <div>
            <strong>FINANCE</strong>

            <span>PERSONAL TRACKER</span>
          </div>

          <button
            className="mobile-close"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-label">MENU</div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                className={`nav-item ${
                  activePage === item.id ? "active" : ""
                }`}
                onClick={() => openPage(item.id)}
              >
                <Icon size={19} />

                <span>{item.label}</span>

                {activePage === item.id && (
                  <i className="active-indicator"></i>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="mini-balance">
            <span>Current balance</span>

            <strong>{formatMoney(balance)}</strong>
          </div>

          <div className="profile-mini">
            <div className="profile-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>

            <div>
              <strong>{user?.name || "My Account"}</strong>

              <span>Personal finance</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={21} />
          </button>

          <div className="top-search">
            <Search size={18} />

            <input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);

                if (e.target.value) {
                  setActivePage("transactions");
                }
              }}
            />
          </div>

          <div className="top-actions">
            <div className="notification-wrap">
              <button
                className="top-icon-button"
                onClick={() =>
                  setShowNotifications(!showNotifications)
                }
              >
                <Bell size={19} />

                {notifications && (
                  <span className="notification-dot"></span>
                )}
              </button>

              {showNotifications && (
                <div className="notification-panel">
                  <strong>Notifications</strong>

                  <p>
                    {notifications
                      ? "You're all caught up."
                      : "Notifications are disabled."}
                  </p>
                </div>
              )}
            </div>

            <button
              className="profile-button"
              onClick={() => openPage("settings")}
            >
              <div className="profile-avatar small">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>

              <div className="profile-text">
                <strong>{user?.name || "Uswa"}</strong>

                <span>Account</span>
              </div>
            </button>
          </div>
        </header>

        {renderPage()}
      </main>

      {showModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">NEW ENTRY</p>

                <h2>Add transaction</h2>
              </div>

              <button
                className="icon-button"
                onClick={() => setShowModal(false)}
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={addTransaction}>
              <div className="type-switch">
                <button
                  type="button"
                  className={
                    form.type === "expense"
                      ? "selected"
                      : ""
                  }
                  onClick={() =>
                    setForm({
                      ...form,
                      type: "expense",
                    })
                  }
                >
                  Expense
                </button>

                <button
                  type="button"
                  className={
                    form.type === "income"
                      ? "selected"
                      : ""
                  }
                  onClick={() =>
                    setForm({
                      ...form,
                      type: "income",
                    })
                  }
                >
                  Income
                </button>
              </div>

              <label>
                Title

                <input
                  type="text"
                  placeholder="e.g. Grocery shopping"
                  value={form.title}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      title: e.target.value,
                    })
                  }
                  required
                />
              </label>

              <label>
                Amount

                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  value={form.amount}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      amount: e.target.value,
                    })
                  }
                  required
                />
              </label>

              <div className="form-grid">
                <label>
                  Category

                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        category: e.target.value,
                      })
                    }
                  >
                    {categories.map((category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Date

                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        date: e.target.value,
                      })
                    }
                  />
                </label>
              </div>

              <label>
                Note

                <textarea
                  placeholder="Optional note..."
                  rows="3"
                  value={form.note}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      note: e.target.value,
                    })
                  }
                />
              </label>

              <button
                type="submit"
                className="primary-button submit-button"
              >
                <Plus size={18} />
                Save transaction
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;