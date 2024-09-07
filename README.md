# OneOnOne - Scheduling Website

**OneOnOne** is a full-stack meeting scheduler website built allowing users to manage their accounts, authenticate securely, and schedule meetings seamlessly. The frontend is dynamic and interactive, providing an intuitive user experience.

## Features

- **User Account Management**: Supports registration, login, and logout functionality using Django and JWT for secure authentication.
- **Dynamic and Responsive UI**: Built with React and Bootstrap, the user interface is responsive and adapts to various screen sizes.
- **Authentication**: Secure user login and session management with JWT (JSON Web Token).

## Tech Stack

- **Backend**:
  - Django (Python)
  - JWT (JSON Web Token) for authentication
- **Frontend**:
  - JavaScript (React)
  - Bootstrap (for responsive design)
- **Markup**: HTML/CSS

## How to Install and Run Locally

1. **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/oneonone-scheduling-website.git
    cd oneonone-scheduling-website
    ```

2. **Backend Setup** (Django):
    - Create and activate a virtual environment:
      ```bash
      python3 -m venv env
      source env/bin/activate  # On Windows, use `env\Scripts\activate`
      ```
    - Install required dependencies:
      ```bash
      pip install -r requirements.txt
      ```
    - Run migrations:
      ```bash
      python manage.py migrate
      ```
    - Start the Django server:
      ```bash
      python manage.py runserver
      ```

3. **Frontend Setup** (React):
    - Navigate to the `frontend/` directory:
      ```bash
      cd frontend
      ```
    - Install required dependencies:
      ```bash
      npm install
      ```
    - Start the React development server:
      ```bash
      npm start
      ```

4. **Access the Application**:
    - Open your browser and go to `http://localhost:8000/` for the Django server or `http://localhost:3000/` for the React frontend.

