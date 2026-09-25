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
  TrendingUp,
  TrendingDown,
  Sparkles,
  Activity,
  LogOut,
  ChevronDown,
  Filter,
  ArrowUp,
  ArrowDown,
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

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import "./index.css";
import Auth from "./Auth";

const API_URL = "http://localhost:5000/api/expenses";

const pageVariants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.2,
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 18,
    scale: 0.98,
  },
  visible: (index = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: index * 0.06,
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const listContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.055,
    },
  },
};

const listItem = {
  hidden: {
    opacity: 0,
    x: -10,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
    },
  },
};

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
  }).format(Number(value) || 0)}`;

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

function AnimatedNumber({ value, prefix = "PKR " }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const target = Number(value) || 0;
    const duration = 700;
    const startTime = performance.now();

    let frame;

    const animate = (currentTime) => {
      const progress = Math.min(
        (currentTime - startTime) / duration,
        1
      );

      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplay(Math.round(target * eased));

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <>
      {prefix}
      {new Intl.NumberFormat("en-PK").format(display)}
    </>
  );
}

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
  const [showNotifications, setShowNotifications] =
    useState(false);

  const [showProfileMenu, setShowProfileMenu] = useState(false);

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
      const workspaceId = localStorage.getItem(
        "spendlyWorkspaceId"
      );

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

    if (!form.title.trim() || !form.amount) return;

    try {
      const token = localStorage.getItem("spendlyToken");
      const workspaceId = localStorage.getItem(
        "spendlyWorkspaceId"
      );

      if (!token) {
        alert("Please login again.");
        return;
      }

      if (!workspaceId) {
        alert(
          "No workspace found. Please logout and login again."
        );
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

  const totalIncome = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "income")
        .reduce(
          (sum, t) => sum + Number(t.amount),
          0
        ),
    [transactions]
  );

  const totalExpense = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "expense")
        .reduce(
          (sum, t) => sum + Number(t.amount),
          0
        ),
    [transactions]
  );

  const balance = totalIncome - totalExpense;

  const savingsRate =
    totalIncome > 0
      ? Math.max(
          0,
          Math.round(
            ((totalIncome - totalExpense) / totalIncome) * 100
          )
        )
      : 0;

  const spendingData = useMemo(
    () => createMonthlyData(transactions),
    [transactions]
  );

  const currentMonthExpense = useMemo(() => {
    const currentMonth = new Date().getMonth();

    return transactions
      .filter(
        (t) =>
          t.type === "expense" &&
          new Date(t.date).getMonth() === currentMonth
      )
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }, [transactions]);

  const currentMonthIncome = useMemo(() => {
    const currentMonth = new Date().getMonth();

    return transactions
      .filter(
        (t) =>
          t.type === "income" &&
          new Date(t.date).getMonth() === currentMonth
      )
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const searchable = `${transaction.title} ${
        transaction.category
      } ${transaction.note || ""}`.toLowerCase();

      const matchesSearch = searchable.includes(
        searchTerm.toLowerCase()
      );

      const transactionDate = toDateInputValue(
        new Date(transaction.date)
      );

      const matchesDate =
        !selectedDate || transactionDate === selectedDate;

      const matchesType =
        selectedType === "all" ||
        transaction.type === selectedType;

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
      .filter((t) => t.type === "expense")
      .forEach((transaction) => {
        if (!totals[transaction.category]) {
          totals[transaction.category] = 0;
        }

        totals[transaction.category] += Number(
          transaction.amount
        );
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
          toDateInputValue(
            new Date(transaction.date)
          ) === selectedDate
      )
    : [];

  const calendarMonthName =
    calendarDate.toLocaleDateString("en-US", {
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
    setShowProfileMenu(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("spendlyToken");
    localStorage.removeItem("spendlyUser");
    localStorage.removeItem("spendlyWorkspaceId");

    setUser(null);
    setTransactions([]);
  };

  const navItems = [
    {
      id: "dashboard",
      label: "Overview",
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

  const renderTransactionRow = (
    transaction,
    compact = false
  ) => {
    const Icon =
      categoryIcons[transaction.category] ||
      CircleDollarSign;

    return (
      <motion.div
        className={`transaction-row ${
          compact ? "compact-row" : ""
        }`}
        key={transaction._id}
        variants={listItem}
        layout
      >
        <div className="transaction-main">
          <motion.div
            className={`transaction-icon ${transaction.type}`}
            whileHover={{
              scale: 1.08,
              rotate: -3,
            }}
          >
            <Icon size={18} />
          </motion.div>

          <div className="transaction-details">
            <h4>{transaction.title}</h4>

            <p>
              {transaction.category}
              <span>•</span>
              {formatDate(transaction.date)}
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
            onClick={() =>
              deleteTransaction(transaction._id)
            }
            title="Delete transaction"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </motion.div>
    );
  };

  const Dashboard = () => (
    <motion.div
      className="page-content"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="dashboard-hero">
        <div>
          <div className="hero-kicker">
            <span className="live-dot" />
            FINANCIAL OVERVIEW
          </div>

          <h1>
            Welcome back,{" "}
            <span>
              {user?.name?.split(" ")[0] || "there"}.
            </span>
          </h1>

          <p>
            Here's what's happening with your money today.
          </p>
        </div>

        <motion.button
          className="primary-button hero-button"
          onClick={() => setShowModal(true)}
          whileHover={{
            y: -2,
            scale: 1.015,
          }}
          whileTap={{
            scale: 0.97,
          }}
        >
          <Plus size={18} />
          New transaction
        </motion.button>
      </div>

      <div className="stats-grid">
        <motion.div
          className="stat-card balance-card"
          custom={0}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{
            y: -4,
          }}
        >
          <div className="stat-card-glow" />

          <div className="stat-top">
            <span>NET BALANCE</span>

            <div className="stat-icon balance-icon">
              <CircleDollarSign size={19} />
            </div>
          </div>

          <div className="stat-number">
            <AnimatedNumber value={balance} />
          </div>

          <div className="balance-footer">
            <div className="balance-status">
              <span className="status-icon">
                {balance >= 0 ? (
                  <TrendingUp size={13} />
                ) : (
                  <TrendingDown size={13} />
                )}
              </span>

              <span>
                {balance >= 0
                  ? "Positive balance"
                  : "Over budget"}
              </span>
            </div>

            <span className="balance-period">
              All time
            </span>
          </div>
        </motion.div>

        <motion.div
          className="stat-card"
          custom={1}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ y: -4 }}
        >
          <div className="stat-top">
            <span>TOTAL INCOME</span>

            <div className="stat-icon income-icon">
              <ArrowDownLeft size={18} />
            </div>
          </div>

          <div className="stat-number">
            <AnimatedNumber value={totalIncome} />
          </div>

          <div className="stat-bottom">
            <span className="positive-pill">
              <ArrowUp size={11} />
              Incoming
            </span>

            <span>All time</span>
          </div>
        </motion.div>

        <motion.div
          className="stat-card"
          custom={2}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ y: -4 }}
        >
          <div className="stat-top">
            <span>TOTAL EXPENSES</span>

            <div className="stat-icon expense-icon">
              <ArrowUpRight size={18} />
            </div>
          </div>

          <div className="stat-number">
            <AnimatedNumber value={totalExpense} />
          </div>

          <div className="stat-bottom">
            <span className="negative-pill">
              <ArrowDown size={11} />
              Outgoing
            </span>

            <span>All time</span>
          </div>
        </motion.div>

        <motion.div
          className="stat-card savings-card"
          custom={3}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ y: -4 }}
        >
          <div className="stat-top">
            <span>SAVINGS RATE</span>

            <div className="stat-icon purple-icon">
              <Sparkles size={18} />
            </div>
          </div>

          <div className="stat-number">
            {savingsRate}%
          </div>

          <div className="savings-progress">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${Math.min(savingsRate, 100)}%`,
              }}
              transition={{
                duration: 0.9,
                delay: 0.35,
              }}
            />
          </div>
        </motion.div>
      </div>

      <div className="dashboard-grid">
        <motion.div
          className="chart-card"
          custom={4}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="card-heading">
            <div>
              <div className="section-kicker">
                CASH FLOW
              </div>

              <h3>Income & expenses</h3>

              <p className="card-description">
                Your financial activity across the year
              </p>
            </div>

            <motion.button
              className="outline-button"
              onClick={() => openPage("analytics")}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              View analytics
              <ArrowUpRight size={14} />
            </motion.button>
          </div>

          <div className="chart-legend">
            <span>
              <i className="legend-dot income-dot" />
              Income
            </span>

            <span>
              <i className="legend-dot expense-dot" />
              Expenses
            </span>

            <span className="chart-period">
              Jan — Dec
            </span>
          </div>

          <div className="chart-wrapper">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <AreaChart
                data={spendingData}
                margin={{
                  top: 20,
                  right: 10,
                  left: -20,
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
                      stopColor="#8b7cf6"
                      stopOpacity={0.32}
                    />

                    <stop
                      offset="100%"
                      stopColor="#8b7cf6"
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
                      stopColor="#ef6f91"
                      stopOpacity={0.22}
                    />

                    <stop
                      offset="100%"
                      stopColor="#ef6f91"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  vertical={false}
                  stroke="#ececf4"
                  strokeDasharray="4 6"
                />

                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#89899b",
                    fontSize: 11,
                  }}
                  dy={10}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#89899b",
                    fontSize: 10,
                  }}
                  tickFormatter={(value) =>
                    value >= 1000
                      ? `PKR ${(value / 1000).toFixed(
                          1
                        )}k`
                      : `PKR ${value}`
                  }
                />

                <Tooltip
                  cursor={{
                    stroke: "#b8b4f7",
                    strokeDasharray: "4 4",
                  }}
                  contentStyle={{
                    border: "1px solid #e5e3ef",
                    borderRadius: "14px",
                    boxShadow:
                      "0 20px 50px rgba(25, 24, 48, 0.12)",
                    background: "#ffffff",
                    fontSize: "12px",
                  }}
                  formatter={(value) => [
                    formatMoney(value),
                    "",
                  ]}
                />

                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#8273ed"
                  strokeWidth={2.5}
                  fill="url(#incomeGradient)"
                  dot={false}
                  activeDot={{
                    r: 5,
                    strokeWidth: 3,
                    fill: "#ffffff",
                    stroke: "#8273ed",
                  }}
                  animationDuration={1100}
                />

                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#eb6c8c"
                  strokeWidth={2.5}
                  fill="url(#expenseGradient)"
                  dot={false}
                  activeDot={{
                    r: 5,
                    strokeWidth: 3,
                    fill: "#ffffff",
                    stroke: "#eb6c8c",
                  }}
                  animationDuration={1200}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          className="side-card"
          custom={5}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="card-heading">
            <div>
              <div className="section-kicker">
                SPENDING
              </div>

              <h3>Top categories</h3>
            </div>

            <button
              className="icon-button"
              onClick={() => openPage("analytics")}
            >
              <MoreHorizontal size={18} />
            </button>
          </div>

          <div className="category-total">
            <span>Total spent</span>

            <strong>{formatMoney(totalExpense)}</strong>
          </div>

          {categoryTotals.length === 0 ? (
            <div className="empty-small">
              <CircleDollarSign size={30} />
              <p>No expenses yet</p>
            </div>
          ) : (
            <motion.div
              className="category-list"
              variants={listContainer}
              initial="hidden"
              animate="visible"
            >
              {categoryTotals.slice(0, 5).map((item) => {
                const Icon =
                  categoryIcons[item.category] ||
                  CircleDollarSign;

                const percentage =
                  totalExpense > 0
                    ? Math.round(
                        (item.amount / totalExpense) *
                          100
                      )
                    : 0;

                return (
                  <motion.div
                    className="category-item"
                    key={item.category}
                    variants={listItem}
                  >
                    <div className="category-icon">
                      <Icon size={16} />
                    </div>

                    <div className="category-info">
                      <div className="category-title">
                        <strong>{item.category}</strong>

                        <span>
                          {formatMoney(item.amount)}
                        </span>
                      </div>

                      <div className="progress-track">
                        <motion.div
                          className="progress-fill"
                          initial={{ width: 0 }}
                          animate={{
                            width: `${percentage}%`,
                          }}
                          transition={{
                            duration: 0.65,
                            delay: 0.15,
                          }}
                        />
                      </div>
                    </div>

                    <span className="category-percent">
                      {percentage}%
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </motion.div>
      </div>

      <motion.div
        className="transactions-card"
        custom={6}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="card-heading">
          <div>
            <div className="section-kicker">
              ACTIVITY
            </div>

            <h3>Recent transactions</h3>

            <p className="card-description">
              Your latest financial activity
            </p>
          </div>

          <button
            className="outline-button"
            onClick={() => openPage("transactions")}
          >
            View all
            <ArrowUpRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="loading-list">
            {[1, 2, 3, 4].map((item) => (
              <div className="skeleton-row" key={item}>
                <div className="skeleton-circle" />

                <div className="skeleton-content">
                  <div className="skeleton-line" />
                  <div className="skeleton-line short" />
                </div>

                <div className="skeleton-amount" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <CreditCard size={27} />
            </div>

            <h4>No transactions yet</h4>

            <p>
              Add your first transaction to start
              tracking.
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
          <motion.div
            className="transaction-list"
            variants={listContainer}
            initial="hidden"
            animate="visible"
          >
            {transactions
              .slice(0, 5)
              .map((transaction) =>
                renderTransactionRow(
                  transaction,
                  true
                )
              )}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );

  const TransactionsPage = () => (
    <motion.div
      className="page-content"
      variants={pageVariants}
      initial="initial"
      animate="animate"
    >
      <div className="dashboard-hero">
        <div>
          <div className="hero-kicker">
            <span className="live-dot" />
            MONEY ACTIVITY
          </div>

          <h1>Transactions</h1>

          <p>
            Search, filter and manage your financial
            activity.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowModal(true)}
        >
          <Plus size={18} />
          New transaction
        </button>
      </div>

      <div className="filter-card">
        <div className="filter-search">
          <Search size={17} />

          <input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
          />
        </div>

        <select
          value={selectedType}
          onChange={(e) =>
            setSelectedType(e.target.value)
          }
        >
          <option value="all">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expenses</option>
        </select>

        <select
          value={selectedCategory}
          onChange={(e) =>
            setSelectedCategory(e.target.value)
          }
        >
          <option value="all">All categories</option>

          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <div className="date-filter">
          <CalendarDays size={16} />

          <input
            type="date"
            value={selectedDate}
            onChange={(e) =>
              setSelectedDate(e.target.value)
            }
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
          <Filter size={15} />
          Reset
        </button>
      </div>

      <div className="transactions-card">
        <div className="card-heading">
          <div>
            <div className="section-kicker">
              TRANSACTION HISTORY
            </div>

            <h3>
              {filteredTransactions.length}{" "}
              transactions
            </h3>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Search size={25} />
            </div>

            <h4>No matching transactions</h4>

            <p>
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <motion.div
            className="transaction-list"
            variants={listContainer}
            initial="hidden"
            animate="visible"
          >
            {filteredTransactions.map((transaction) =>
              renderTransactionRow(transaction)
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );

  const CalendarPage = () => {
    const selectedIncome = selectedDayTransactions
      .filter((t) => t.type === "income")
      .reduce(
        (sum, t) => sum + Number(t.amount),
        0
      );

    const selectedExpense = selectedDayTransactions
      .filter((t) => t.type === "expense")
      .reduce(
        (sum, t) => sum + Number(t.amount),
        0
      );

    return (
      <motion.div
        className="page-content"
        variants={pageVariants}
        initial="initial"
        animate="animate"
      >
        <div className="dashboard-hero">
          <div>
            <div className="hero-kicker">
              <span className="live-dot" />
              DATE VIEW
            </div>

            <h1>Calendar</h1>

            <p>
              Explore your financial activity by date.
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
          <motion.div
            className="calendar-card"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="calendar-header">
              <button
                className="calendar-nav"
                onClick={() =>
                  changeCalendarMonth(-1)
                }
              >
                <ChevronLeft size={18} />
              </button>

              <div>
                <span>MONTH</span>
                <h2>{calendarMonthName}</h2>
              </div>

              <button
                className="calendar-nav"
                onClick={() =>
                  changeCalendarMonth(1)
                }
              >
                <ChevronRight size={18} />
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
                const dateValue =
                  toDateInputValue(item.date);

                const hasTransactions =
                  transactions.some(
                    (transaction) =>
                      toDateInputValue(
                        new Date(
                          transaction.date
                        )
                      ) === dateValue
                  );

                const isSelected =
                  selectedDate === dateValue;

                const isToday =
                  dateValue ===
                  toDateInputValue(new Date());

                return (
                  <motion.button
                    key={index}
                    className={`calendar-day ${
                      !item.current
                        ? "muted-day"
                        : ""
                    } ${
                      isSelected
                        ? "selected-day"
                        : ""
                    } ${
                      isToday
                        ? "today-day"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedDate(dateValue)
                    }
                    whileHover={{
                      scale: 1.04,
                    }}
                    whileTap={{
                      scale: 0.94,
                    }}
                  >
                    <span>{item.day}</span>

                    {hasTransactions && (
                      <i className="calendar-dot" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            className="calendar-summary"
            variants={cardVariants}
            custom={1}
            initial="hidden"
            animate="visible"
          >
            <div className="summary-header">
              <div>
                <div className="section-kicker">
                  SELECTED DAY
                </div>

                <h3>
                  {selectedDate
                    ? formatDate(selectedDate)
                    : "Choose a date"}
                </h3>
              </div>

              <CalendarDays size={21} />
            </div>

            {selectedDate ? (
              <>
                <div className="day-stats">
                  <div className="day-stat income-stat">
                    <span>Income</span>

                    <strong>
                      +{formatMoney(selectedIncome)}
                    </strong>
                  </div>

                  <div className="day-stat expense-stat">
                    <span>Expenses</span>

                    <strong>
                      -{formatMoney(selectedExpense)}
                    </strong>
                  </div>
                </div>

                <div className="selected-transactions">
                  {selectedDayTransactions.length ===
                  0 ? (
                    <div className="empty-small">
                      <p>
                        No transactions on this date.
                      </p>
                    </div>
                  ) : (
                    <motion.div
                      variants={listContainer}
                      initial="hidden"
                      animate="visible"
                    >
                      {selectedDayTransactions.map(
                        (transaction) =>
                          renderTransactionRow(
                            transaction,
                            true
                          )
                      )}
                    </motion.div>
                  )}
                </div>
              </>
            ) : (
              <div className="calendar-placeholder">
                <div className="empty-icon">
                  <CalendarDays size={28} />
                </div>

                <p>
                  Select a date to see your
                  financial activity.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    );
  };

  const AnalyticsPage = () => (
    <motion.div
      className="page-content"
      variants={pageVariants}
      initial="initial"
      animate="animate"
    >
      <div className="dashboard-hero">
        <div>
          <div className="hero-kicker">
            <span className="live-dot" />
            FINANCIAL INTELLIGENCE
          </div>

          <h1>Analytics</h1>

          <p>
            Understand your income and spending
            patterns.
          </p>
        </div>
      </div>

      <div className="stats-grid analytics-stats">
        <motion.div
          className="stat-card"
          variants={cardVariants}
          custom={0}
          initial="hidden"
          animate="visible"
        >
          <div className="stat-top">
            <span>MONTHLY EXPENSE</span>

            <div className="stat-icon expense-icon">
              <ArrowUpRight size={18} />
            </div>
          </div>

          <div className="stat-number">
            {formatMoney(currentMonthExpense)}
          </div>

          <div className="stat-bottom">
            <span>Current month</span>
          </div>
        </motion.div>

        <motion.div
          className="stat-card"
          variants={cardVariants}
          custom={1}
          initial="hidden"
          animate="visible"
        >
          <div className="stat-top">
            <span>MONTHLY INCOME</span>

            <div className="stat-icon income-icon">
              <ArrowDownLeft size={18} />
            </div>
          </div>

          <div className="stat-number">
            {formatMoney(currentMonthIncome)}
          </div>

          <div className="stat-bottom">
            <span>Current month</span>
          </div>
        </motion.div>

        <motion.div
          className="stat-card"
          variants={cardVariants}
          custom={2}
          initial="hidden"
          animate="visible"
        >
          <div className="stat-top">
            <span>LARGEST CATEGORY</span>

            <div className="stat-icon purple-icon">
              <PieChart size={18} />
            </div>
          </div>

          <div className="analytics-value">
            {categoryTotals[0]?.category || "—"}
          </div>

          <div className="stat-bottom">
            <span>
              {categoryTotals[0]
                ? formatMoney(
                    categoryTotals[0].amount
                  )
                : "No data"}
            </span>
          </div>
        </motion.div>

        <motion.div
          className="stat-card"
          variants={cardVariants}
          custom={3}
          initial="hidden"
          animate="visible"
        >
          <div className="stat-top">
            <span>TRANSACTIONS</span>

            <div className="stat-icon">
              <Activity size={18} />
            </div>
          </div>

          <div className="stat-number">
            {transactions.length}
          </div>

          <div className="stat-bottom">
            <span>All recorded activity</span>
          </div>
        </motion.div>
      </div>

      <div className="chart-card analytics-chart">
        <div className="card-heading">
          <div>
            <div className="section-kicker">
              YEAR OVERVIEW
            </div>

            <h3>Cash flow trend</h3>

            <p className="card-description">
              Income versus expenses over time
            </p>
          </div>
        </div>

        <div className="chart-wrapper large-chart">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <AreaChart
              data={spendingData}
              margin={{
                top: 20,
                right: 15,
                left: -20,
                bottom: 0,
              }}
            >
              <CartesianGrid
                vertical={false}
                stroke="#ececf4"
                strokeDasharray="4 6"
              />

              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "#89899b",
                  fontSize: 11,
                }}
                dy={10}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "#89899b",
                  fontSize: 10,
                }}
                tickFormatter={(value) =>
                  value >= 1000
                    ? `PKR ${(value / 1000).toFixed(
                        1
                      )}k`
                    : `PKR ${value}`
                }
              />

              <Tooltip
                contentStyle={{
                  border: "1px solid #e5e3ef",
                  borderRadius: "14px",
                  background: "#ffffff",
                  boxShadow:
                    "0 20px 50px rgba(25, 24, 48, 0.12)",
                }}
                formatter={(value) =>
                  formatMoney(value)
                }
              />

              <Area
                type="monotone"
                dataKey="income"
                stroke="#8273ed"
                strokeWidth={2.5}
                fill="none"
                animationDuration={1000}
              />

              <Area
                type="monotone"
                dataKey="expense"
                stroke="#eb6c8c"
                strokeWidth={2.5}
                fill="none"
                animationDuration={1150}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="transactions-card">
        <div className="card-heading">
          <div>
            <div className="section-kicker">
              BREAKDOWN
            </div>

            <h3>Spending by category</h3>
          </div>
        </div>

        {categoryTotals.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <PieChart size={25} />
            </div>

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
                      (item.amount /
                        totalExpense) *
                        100
                    )
                  : 0;

              return (
                <motion.div
                  className="analytics-category"
                  key={item.category}
                  whileHover={{
                    y: -3,
                    borderColor: "#d6d2ff",
                  }}
                >
                  <div className="analytics-category-icon">
                    <Icon size={18} />
                  </div>

                  <div>
                    <strong>{item.category}</strong>

                    <p>
                      {formatMoney(item.amount)}
                    </p>
                  </div>

                  <span>{percentage}%</span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );

  const SettingsPage = () => (
    <motion.div
      className="page-content"
      variants={pageVariants}
      initial="initial"
      animate="animate"
    >
      <div className="dashboard-hero">
        <div>
          <div className="hero-kicker">
            <span className="live-dot" />
            PREFERENCES
          </div>

          <h1>Settings</h1>

          <p>
            Manage your account and dashboard
            preferences.
          </p>
        </div>
      </div>

      <div className="settings-layout">
        <div className="settings-profile-card">
          <div className="large-avatar">
            {user?.name?.charAt(0)?.toUpperCase() ||
              "U"}
          </div>

          <h3>{user?.name || "My Account"}</h3>

          <p>Personal finance workspace</p>

          <div className="profile-badge">
            <Sparkles size={13} />
            Active account
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-section">
            <div className="settings-title">
              <div className="settings-icon">
                <Bell size={18} />
              </div>

              <div>
                <h3>Notifications</h3>

                <p>
                  Show reminders and updates inside
                  the dashboard.
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
              <span />
            </button>
          </div>

          <div className="settings-section">
            <div className="settings-title">
              <div className="settings-icon">
                <CircleDollarSign size={18} />
              </div>

              <div>
                <h3>Currency</h3>

                <p>
                  Your dashboard uses Pakistani
                  Rupees.
                </p>
              </div>
            </div>

            <span className="setting-value">
              PKR
            </span>
          </div>

          <div className="settings-section">
            <div className="settings-title">
              <div className="settings-icon">
                <SlidersHorizontal size={18} />
              </div>

              <div>
                <h3>Reset filters</h3>

                <p>
                  Clear search, date and category
                  filters.
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
              <div className="settings-icon danger-icon">
                <LogOut size={18} />
              </div>

              <div>
                <h3>Sign out</h3>

                <p>
                  Sign out from this account on this
                  device.
                </p>
              </div>
            </div>

            <button
              className="danger-button"
              onClick={handleLogout}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </motion.div>
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
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={`sidebar ${
          sidebarOpen ? "sidebar-open" : ""
        }`}
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{
          duration: 0.45,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <div className="brand">
          <motion.div
            className="brand-mark"
            whileHover={{
              rotate: -5,
              scale: 1.06,
            }}
          >
            <CircleDollarSign size={21} />
          </motion.div>

          <div>
            <strong>FINANCE</strong>
            <span>PERSONAL OS</span>
          </div>

          <button
            className="mobile-close"
            onClick={() =>
              setSidebarOpen(false)
            }
          >
            <X size={20} />
          </button>
        </div>

        <div className="workspace-switcher">
          <div className="workspace-avatar">
            {user?.name?.charAt(0)?.toUpperCase() ||
              "U"}
          </div>

          <div>
            <span>WORKSPACE</span>
            <strong>Personal Finance</strong>
          </div>

          <ChevronDown size={15} />
        </div>

        <div className="sidebar-label">
          NAVIGATION
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activePage === item.id;

            return (
              <motion.button
                key={item.id}
                className={`nav-item ${
                  active ? "active" : ""
                }`}
                onClick={() => openPage(item.id)}
                whileHover={{
                  x: 3,
                }}
                whileTap={{
                  scale: 0.98,
                }}
              >
                <Icon size={18} />

                <span>{item.label}</span>

                {active && (
                  <motion.i
                    className="active-indicator"
                    layoutId="active-nav"
                    transition={{
                      type: "spring",
                      stiffness: 450,
                      damping: 32,
                    }}
                  />
                )}
              </motion.button>
            );
          })}
        </nav>

        <div className="sidebar-spacer" />

        <div className="sidebar-insight">
          <div className="insight-icon">
            <Sparkles size={15} />
          </div>

          <div>
            <span>THIS MONTH</span>

            <strong>
              {formatMoney(currentMonthExpense)}
            </strong>
          </div>

          <Activity size={16} />
        </div>

        <div className="profile-mini">
          <div className="profile-avatar">
            {user?.name?.charAt(0)?.toUpperCase() ||
              "U"}
          </div>

          <div>
            <strong>
              {user?.name || "My Account"}
            </strong>

            <span>Personal workspace</span>
          </div>

          <button
            className="profile-more"
            onClick={handleLogout}
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </motion.aside>

      <main className="main-area">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() =>
              setSidebarOpen(true)
            }
          >
            <Menu size={21} />
          </button>

          <div className="top-search">
            <Search size={17} />

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

            <span className="search-shortcut">
              /
            </span>
          </div>

          <div className="top-actions">
            <div className="notification-wrap">
              <motion.button
                className="top-icon-button"
                onClick={() =>
                  setShowNotifications(
                    !showNotifications
                  )
                }
                whileHover={{
                  y: -2,
                }}
                whileTap={{
                  scale: 0.94,
                }}
              >
                <Bell size={18} />

                {notifications && (
                  <span className="notification-dot" />
                )}
              </motion.button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    className="notification-panel"
                    initial={{
                      opacity: 0,
                      y: -8,
                      scale: 0.97,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                    }}
                    exit={{
                      opacity: 0,
                      y: -8,
                      scale: 0.97,
                    }}
                  >
                    <div className="notification-heading">
                      <strong>
                        Notifications
                      </strong>

                      <span>NOW</span>
                    </div>

                    <div className="notification-item">
                      <div className="notification-symbol">
                        <Activity size={14} />
                      </div>

                      <div>
                        <strong>
                          You're all caught up
                        </strong>

                        <p>
                          No new financial alerts.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="profile-wrap">
              <motion.button
                className="profile-button"
                onClick={() =>
                  setShowProfileMenu(
                    !showProfileMenu
                  )
                }
                whileHover={{ y: -1 }}
              >
                <div className="profile-avatar small">
                  {user?.name
                    ?.charAt(0)
                    ?.toUpperCase() || "U"}
                </div>

                <div className="profile-text">
                  <strong>
                    {user?.name || "Account"}
                  </strong>

                  <span>Personal</span>
                </div>

                <ChevronDown size={14} />
              </motion.button>

              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    className="profile-dropdown"
                    initial={{
                      opacity: 0,
                      y: -8,
                      scale: 0.97,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                    }}
                    exit={{
                      opacity: 0,
                      y: -8,
                      scale: 0.97,
                    }}
                  >
                    <button
                      onClick={() =>
                        openPage("settings")
                      }
                    >
                      <Settings size={15} />
                      Account settings
                    </button>

                    <button
                      className="dropdown-danger"
                      onClick={handleLogout}
                    >
                      <LogOut size={15} />
                      Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <div key={activePage}>
            {renderPage()}
          </div>
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() =>
              setShowModal(false)
            }
          >
            <motion.div
              className="modal"
              initial={{
                opacity: 0,
                y: 25,
                scale: 0.96,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 15,
                scale: 0.97,
              }}
              transition={{
                duration: 0.25,
              }}
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <div className="modal-header">
                <div>
                  <div className="section-kicker">
                    NEW ENTRY
                  </div>

                  <h2>
                    Add transaction
                  </h2>

                  <p>
                    Record an income or expense.
                  </p>
                </div>

                <button
                  className="icon-button"
                  onClick={() =>
                    setShowModal(false)
                  }
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={addTransaction}>
                <div className="type-switch">
                  <button
                    type="button"
                    className={
                      form.type === "expense"
                        ? "selected expense-selected"
                        : ""
                    }
                    onClick={() =>
                      setForm({
                        ...form,
                        type: "expense",
                      })
                    }
                  >
                    <ArrowUpRight
                      size={15}
                    />
                    Expense
                  </button>

                  <button
                    type="button"
                    className={
                      form.type === "income"
                        ? "selected income-selected"
                        : ""
                    }
                    onClick={() =>
                      setForm({
                        ...form,
                        type: "income",
                      })
                    }
                  >
                    <ArrowDownLeft
                      size={15}
                    />
                    Income
                  </button>
                </div>

                <label>
                  Transaction title

                  <input
                    type="text"
                    placeholder="e.g. Grocery shopping"
                    value={form.title}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        title:
                          e.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label>
                  Amount

                  <div className="amount-input">
                    <span>PKR</span>

                    <input
                      type="number"
                      placeholder="0"
                      min="0"
                      value={form.amount}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          amount:
                            e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </label>

                <div className="form-grid">
                  <label>
                    Category

                    <select
                      value={form.category}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          category:
                            e.target.value,
                        })
                      }
                    >
                      {categories.map(
                        (category) => (
                          <option
                            key={category}
                            value={category}
                          >
                            {category}
                          </option>
                        )
                      )}
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
                          date:
                            e.target.value,
                        })
                      }
                    />
                  </label>
                </div>

                <label>
                  Note

                  <textarea
                    placeholder="Add an optional note..."
                    rows="3"
                    value={form.note}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        note:
                          e.target.value,
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;