# 📂 PDF Vault Dashboard

A modern, full-stack Document Management System featuring a beautiful animated Glassmorphism UI. Users can securely upload, manage, and delete PDF documents with real-time feedback.

![Dashboard Preview](https://github.com) 
*(Note: Replace this link with your actual screenshot later)*

## 🚀 Key Features
- **Secure Authentication**: Implementation of JWT (JSON Web Tokens) for protected routes and session management.
- **Multi-File Upload**: Bulk upload capability using Multer with strict file-type validation (PDF only).
- **Bulk Operations**: Advanced delete functionality allowing users to remove single or multiple files simultaneously.
- **Animated Glassmorphism UI**: High-end frontend design featuring moving mesh gradient backgrounds and frosted glass cards.
- **Dynamic Notifications**: Real-time "Toast" popups that provide user feedback on actions (Success/Delete counts).

## 🛠️ Tech Stack
- **Frontend**: HTML5, Tailwind CSS, JavaScript (ES6+), Animate.css
- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas (Cloud)
- **Security**: Bcrypt.js (Password Hashing), JWT (Authorization)
- **File System**: Multer (File Handling), Path, FS

## 📥 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com
   ```

2. **Setup Backend**:
   - Navigate to `backend/`
   - Run `npm install`
   - Create a `.env` file and add your `MONGO_URI` and `SECRET_KEY`.

3. **Run the Server**:
   ```bash
   node server.js
   ```

4. **Launch Frontend**:
   - Open `frontend/index.html` in your browser (Live Server recommended).

## 🛡️ Security Note
This project follows security best practices by using `.gitignore` to prevent sensitive environment variables and system-specific files (node_modules) from being exposed.
