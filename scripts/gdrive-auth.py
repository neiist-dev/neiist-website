import sys
import os
# pylint: disable=no-name-in-module
from PyQt5.QtWidgets import (
    QApplication, QWidget, QFileDialog, QMessageBox, QVBoxLayout, QPushButton, QLabel, QFrame
)
from PyQt5.QtGui import QFont, QIcon, QColor, QPalette
from PyQt5.QtCore import Qt
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.exceptions import GoogleAuthError

SCOPES = ["https://www.googleapis.com/auth/drive.file"]

class AuthWindow(QWidget):
    """Auth main window"""
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Google Drive Auth")
        self.setGeometry(100, 100, 420, 260)
        self.setMinimumSize(768, 480)
        self.setWindowIcon(QIcon.fromTheme("drive-harddisk"))

        # Set background color and style
        palette = self.palette()
        palette.setColor(QPalette.Window, QColor("#f5f5f7"))
        self.setPalette(palette)

        layout = QVBoxLayout()
        layout.setSpacing(18)
        layout.setContentsMargins(32, 32, 32, 32)

        self.info_label = QLabel("Authenticate with Google Drive and save your token.")
        self.info_label.setFont(QFont("San Francisco", 15, QFont.Bold))
        self.info_label.setAlignment(getattr(Qt, "AlignCenter"))
        layout.addWidget(self.info_label)

        # Divider
        divider = QFrame()
        divider.setFrameShape(QFrame.HLine)
        divider.setFrameShadow(QFrame.Sunken)
        layout.addWidget(divider)

        # Buttons
        self.cred_btn = QPushButton("Select Google Client Secret JSON")
        self.cred_btn.setFont(QFont("San Francisco", 12))
        self.cred_btn.setStyleSheet("padding: 10px; background: #fff; border-radius: 8px;")
        self.cred_btn.clicked.connect(self.select_credentials_file)
        layout.addWidget(self.cred_btn)

        self.token_btn = QPushButton("Select location to save token")
        self.token_btn.setFont(QFont("San Francisco", 12))
        self.token_btn.setStyleSheet("padding: 10px; background: #fff; border-radius: 8px;")
        self.token_btn.clicked.connect(self.select_token_path)
        self.token_btn.setEnabled(False)
        layout.addWidget(self.token_btn)

        self.auth_btn = QPushButton("Authorize and Save Token")
        self.auth_btn.setFont(QFont("San Francisco", 12, QFont.Bold))
        self.auth_btn.setStyleSheet("padding: 10px; background: #007aff; \
          color: #fff; border-radius: 8px;")
        self.auth_btn.clicked.connect(self.authorize)
        self.auth_btn.setEnabled(False)
        layout.addWidget(self.auth_btn)

        # Footer
        self.footer = QLabel("Google Drive authentication for NEIIST setup")
        self.footer.setFont(QFont("San Francisco", 10))
        self.footer.setAlignment(getattr(Qt, "AlignRight"))
        self.footer.setStyleSheet("color: #888; margin-top: 12px;")
        layout.addWidget(self.footer)

        self.credentials_path = None
        self.token_path = None

        self.setLayout(layout)

    def select_credentials_file(self):
        """Dialog to select the client_secret json"""
        path, _ = QFileDialog.getOpenFileName(
            self, "Select Google Client Secret JSON", "", "JSON Files (*.json)"
        )
        if path:
            self.credentials_path = path
            self.token_btn.setEnabled(True)
            self.info_label.setText("✅ Credentials file selected. Now choose where" \
            "to save your token.")

    def select_token_path(self):
        """Dialog to select path to save the token"""
        path, _ = QFileDialog.getSaveFileName(
            self, "Select location to save token", "", "JSON Files (*.json)"
        )
        if path:
            self.token_path = path
            self.auth_btn.setEnabled(True)
            self.info_label.setText("Token path selected. Click 'Authorize and" \
            "Save Token' to continue.")

def authorize(self):
    """Google OAuth2 functions"""
    if not self.credentials_path:
        QMessageBox.critical(self, "Error", "No credentials file selected.")
        self.info_label.setText("Select a valid credentials JSON file.")
        return
    if not self.token_path:
        QMessageBox.critical(self, "Error", "No token path selected.")
        self.info_label.setText("Select a valid token save location.")
        return
    try:
        flow = InstalledAppFlow.from_client_secrets_file(self.credentials_path, SCOPES)
        creds = flow.run_local_server(port=0)
        token_dir = os.path.dirname(self.token_path)
        if token_dir:
            os.makedirs(token_dir, exist_ok=True)
        with open(self.token_path, "w", encoding="utf-8") as token_file:
            token_file.write(creds.to_json())
        os.chmod(self.token_path, 0o600)
        QMessageBox.information(self, "Success", f"Token stored to {self.token_path}")
        self.info_label.setText("Token saved! You can close this window.")
    except FileNotFoundError as e:
        QMessageBox.critical(self, "Error", f"Credentials file not found: {e}")
        self.info_label.setText("Credentials file not found. Select a valid JSON file.")
    except GoogleAuthError as e:
        QMessageBox.critical(self, "Error", f"Authentication error: {e}")
        self.info_label.setText("Authentication failed. Try again.")
    except (OSError, ValueError) as e:
        QMessageBox.critical(self, "Error", f"I/O or value error: {e}")
        self.info_label.setText("An error occurred while saving the token or" \
        "processing the response. Try again.")

def main():
    """Main"""
    app = QApplication(sys.argv)
    app.setStyle("Fusion")
    window = AuthWindow()
    window.show()
    sys.exit(app.exec_())

if __name__ == "__main__":
    main()
