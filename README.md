```markdown
# 🛒 ForTechZ POS System

A modern, cross-platform Point of Sale (POS) application designed for speed, efficiency, and seamless user experience. Built with React and wrapped in Electron, this system runs natively on both macOS and Windows, offering a robust backend powered by Node.js and PostgreSQL.

---

## ✨ Features

* **Advanced Checkout POS:** Fast, intuitive interface for processing cash and card transactions, splitting payments, and holding orders.
* **Smart Inventory Management:** Track stock levels, manage general items, and view detailed stock history in real-time.
* **Pre-Orders & Reservations:** Dedicated dashboard to manage customer pre-orders and reservations.
* **Supplier Directory:** Maintain and organize vendor and supplier contact information.
* **Shift Management & Z-Reports:** Secure end-of-shift cash drawer reconciliation and automated Z-Report generation.
* **Hardware Integration:** Built-in support for physical USB receipt printers (`escpos-usb`).
* **Sleek UI/UX:** Fully responsive design featuring instant Light/Dark mode toggling and custom UI elements.
* **Admin Controls:** Secure role-based access for managers to view sales history, reports, and manage user accounts.

---

## 🛠️ Tech Stack

**Frontend:**
* [React](https://reactjs.org/) (via [Vite](https://vitejs.dev/))
* [Tailwind CSS](https://tailwindcss.com/)
* [Lucide React](https://lucide.dev/) (Icons)

**Backend & Database:**
* [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
* [PostgreSQL](https://www.postgresql.org/) (`pg`)

**Desktop Wrapper:**
* [Electron](https://www.electronjs.org/)
* [Electron Builder](https://www.electron.build/) (For generating `.exe` and `.dmg` installers)

---

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (v16 or higher)
* [PostgreSQL](https://www.postgresql.org/) (Local or Cloud instance)

### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/Risath07/fortechz-pos-system.git](https://github.com/Risath07/fortechz-pos-system.git)
   cd fortechz-pos-system

```

2. **Install backend and Electron dependencies:**
```bash
npm install

```


3. **Install frontend dependencies & build the UI:**
Navigate to your frontend directory (e.g., `ui` or `src`), install the packages, and run the build command so Electron can serve it.
```bash
cd ui
npm install
npm run build
cd ..

```


4. **Database Setup:**
Ensure your PostgreSQL server is running and configure your `.env` file in the root directory with your database credentials.

### Running Locally (Development Mode)

To spin up the local Express server and open the Electron desktop app:

```bash
npm start

```

---

## 📦 Building Installers (Production)

You can package this application into a standalone installer for macOS or Windows.

**To build a Windows Installer (`.exe`):**

```bash
npm run build-exe

```

**To build a macOS Installer (`.dmg`):**

```bash
npm run build-mac

```

*Note: The generated installers will be located in the `release/` directory.*

---

## 👨‍💻 Author

**Risath Wijethunga** | ForTechZ Pvt Limited

* GitHub: [@Risath07](https://github.com/Risath07)

---

> **Note on USB Printers (escpos-usb):** If you are building this project on a new Mac or Linux machine for the first time, ensure you have the native build tools installed (e.g., `xcode-select --install` on macOS), as hardware communication libraries require C++ compilation.

```

```
